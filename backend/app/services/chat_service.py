import asyncio
import json
import logging
import uuid
from typing import AsyncGenerator

from cerebras.cloud.sdk import AsyncCerebras
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.chat import ChatConversation, ChatMessage
from app.services.vector_search_service import search_for_rag
from app.services.reranker_service import rerank

logger = logging.getLogger(__name__)

_semaphore = asyncio.Semaphore(5)

SYSTEM_PROMPT = """Eres un asistente documental riguroso. Tu función principal es responder preguntas basándote ÚNICAMENTE en el contexto documental proporcionado, pero también puedes mantener una interacción conversacional natural.

REGLA DE IDIOMA (CRÍTICA, APLICA SIEMPRE):
Responde EXCLUSIVAMENTE en el mismo idioma de la última pregunta del usuario. Ignora el idioma del contexto documental y del historial.
- Si el usuario escribe en inglés ("What is...?", "How many...?") → responde en INGLÉS, aunque los documentos estén en español.
- Si el usuario escribe en español → responde en español.
- Si el usuario escribe en francés → responde en francés.
Nunca cambies de idioma a mitad de respuesta.

CLASIFICACIÓN DEL MENSAJE (haz esto primero):
- Si el mensaje es un saludo, despedida, agradecimiento, o frase trivial sin pregunta (ej: "hola", "buenos días", "gracias", "adiós", "ok", "vale", "¿qué tal?"), responde con UNA frase breve y cordial ofreciendo ayuda. NO consultes los documentos. NO digas "no se encuentra" ni "no hay información".
  Ejemplos correctos:
    Usuario: "hola" → "¡Hola! ¿En qué puedo ayudarte con tus documentos?"
    Usuario: "gracias" → "¡De nada! Si tienes más preguntas, estaré aquí."
    Usuario: "Hi" → "Hi! How can I help you with your documents?"
- Si el mensaje es una pregunta sobre el contenido de los documentos, aplica TODAS las reglas siguientes.

REGLAS OBLIGATORIAS PARA PREGUNTAS DOCUMENTALES:
1. Cita textualmente entre comillas cuando uses información del documento. No parafrasees datos legales, técnicos o numéricos (artículos, fechas, plazos, cantidades, nombres propios).
2. Si la información no está explícitamente en el contexto, responde: "Esta información no se encuentra en los documentos proporcionados" (en el idioma del usuario). NUNCA inventes datos ni completes con conocimiento general.
3. Cita el artículo, apartado, página o sección exactos solo cuando aparezcan literalmente en el contexto. Si no aparecen, NO inventes referencias numéricas.
4. Si una respuesta requiere combinar información de artículos o secciones distintos, indica explícitamente de cuál proviene cada parte.
5. Si la pregunta es ambigua, pide aclaración antes de responder.
6. PROHIBIDO ABSOLUTO: completar números, fechas, plazos, duraciones, cuantías, porcentajes o cualquier dato cuantitativo con conocimiento externo. Si solo encuentras parte del dato (ej: "renovable por igual periodo" sin la duración inicial), indícalo explícitamente: "El contexto menciona X pero no especifica Y".
7. PROHIBIDO ABSOLUTO: hacer inferencias, deducciones o suposiciones sobre datos no presentes literalmente en el contexto.
8. Antes de responder un dato numérico, verifica que ese número aparece literalmente en el contexto. Si no aparece, NO lo escribas."""


def _build_context(chunks: list[dict]) -> str:
    if not chunks:
        return "(Ningún fragmento documental coincide con esta consulta concreta. Esto NO significa que no haya documentos cargados — el usuario sí tiene documentos disponibles.)"

    parts = []
    for i, chunk in enumerate(chunks, 1):
        doc_name = chunk.get("metadata", {}).get("document_name", "Unknown")
        parts.append(f"[Source {i}: {doc_name}]\n{chunk['content']}")
    return "\n\n---\n\n".join(parts)


def _build_sources(chunks: list[dict]) -> list[dict]:
    grouped: dict[str, dict] = {}
    for chunk in chunks:
        doc_name = chunk.get("metadata", {}).get("document_name", "Unknown")
        score = chunk.get("rerank_score") or chunk.get("rrf_score") or chunk.get("score") or 0.0

        if doc_name not in grouped:
            grouped[doc_name] = {
                "document_name": doc_name,
                "excerpts": [],
                "best_score": score,
            }

        grouped[doc_name]["excerpts"].append({
            "chunk_id": chunk["chunk_id"],
            "preview": chunk["content"][:400],
            "score": chunk.get("rrf_score") or chunk.get("score"),
            "rerank_score": chunk.get("rerank_score"),
        })

        if score > grouped[doc_name]["best_score"]:
            grouped[doc_name]["best_score"] = score

    return sorted(grouped.values(), key=lambda x: x["best_score"], reverse=True)


async def get_conversation_history(db: AsyncSession, conversation_id: uuid.UUID, limit: int = 10) -> list[dict]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = list(reversed(result.scalars().all()))
    return [{"role": msg.role, "content": msg.content} for msg in messages]


async def stream_rag_response(
    db: AsyncSession,
    conversation: ChatConversation,
    user_message: str,
    user_id: uuid.UUID,
) -> AsyncGenerator[str, None]:
    async with _semaphore:
        # Save user message
        user_msg = ChatMessage(
            conversation_id=conversation.id,
            role="user",
            content=user_message,
        )
        db.add(user_msg)
        await db.commit()

        # RAG: search + rerank
        chunks = await search_for_rag(
            db, user_message, user_id,
            document_ids=conversation.document_ids,
        )

        if chunks:
            chunks = await rerank(user_message, chunks, top_k=15)

        context = _build_context(chunks)
        sources = _build_sources(chunks)

        # Build messages for LLM
        history = await get_conversation_history(db, conversation.id, limit=10)
        llm_messages = [
            {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n---\nDocument context:\n{context}"},
            *history,
            {"role": "user", "content": user_message},
        ]

        # Stream from Cerebras
        client = AsyncCerebras(api_key=settings.CEREBRAS_API_KEY)
        full_response = ""

        try:
            stream = await client.chat.completions.create(
                model=settings.CEREBRAS_MODEL,
                messages=llm_messages,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token = chunk.choices[0].delta.content
                    full_response += token
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        except Exception as e:
            logger.error(f"Cerebras streaming error: {e}")
            full_response = "No he podido generar una respuesta. Intenta reformular tu pregunta."
            yield f"data: {json.dumps({'type': 'token', 'content': full_response})}\n\n"

        # Save assistant message with sources
        assistant_msg = ChatMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=full_response,
            sources=sources,
        )
        db.add(assistant_msg)
        await db.commit()
        await db.refresh(assistant_msg)

        yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_msg.id, 'sources': sources})}\n\n"
