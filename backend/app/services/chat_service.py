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

SYSTEM_PROMPT = """You are a helpful document assistant. Answer questions based on the provided document context.
If the context contains relevant information, use it to answer accurately and cite which document it comes from.
If the context doesn't contain enough information to answer, say so honestly.
Always respond in the same language as the user's question."""


def _build_context(chunks: list[dict]) -> str:
    if not chunks:
        return "No relevant documents found."

    parts = []
    for i, chunk in enumerate(chunks, 1):
        doc_name = chunk.get("metadata", {}).get("document_name", "Unknown")
        parts.append(f"[Source {i}: {doc_name}]\n{chunk['content']}")
    return "\n\n---\n\n".join(parts)


def _build_sources(chunks: list[dict]) -> list[dict]:
    return [
        {
            "chunk_id": chunk["chunk_id"],
            "score": chunk.get("rrf_score") or chunk.get("score"),
            "rerank_score": chunk.get("rerank_score"),
            "preview": chunk["content"][:150],
            "document_name": chunk.get("metadata", {}).get("document_name", "Unknown"),
        }
        for chunk in chunks
    ]


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
            chunks = await rerank(user_message, chunks, top_k=5)

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
