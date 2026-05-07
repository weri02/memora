from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.models.chat import ChatConversation, ChatMessage
from app.schemas.chat import (
    CreateConversationRequest,
    UpdateConversationRequest,
    SendMessageRequest,
    ConversationResponse,
    ConversationDetailResponse,
    MessageResponse,
)
from app.services.chat_service import stream_rag_response

router = APIRouter(prefix="/chat", tags=["chat"])


async def _get_user_conversation(
    conversation_id: UUID, user_id: UUID, db: AsyncSession
) -> ChatConversation:
    result = await db.execute(
        select(ChatConversation).where(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == user_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")
    return conv


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    data: CreateConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = ChatConversation(
        user_id=current_user.id,
        titulo=data.titulo or "New conversation",
        document_ids=data.document_ids,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatConversation)
        .where(ChatConversation.user_id == current_user.id)
        .order_by(ChatConversation.updated_at.desc())
    )
    return result.scalars().all()


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatConversation)
        .options(selectinload(ChatConversation.messages))
        .where(
            ChatConversation.id == conversation_id,
            ChatConversation.user_id == current_user.id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundError("Conversation not found")
    return conv


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: UUID,
    data: UpdateConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await _get_user_conversation(conversation_id, current_user.id, db)

    if data.titulo is not None:
        conv.titulo = data.titulo
    if data.document_ids is not None:
        conv.document_ids = data.document_ids

    await db.commit()
    await db.refresh(conv)
    return conv


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await _get_user_conversation(conversation_id, current_user.id, db)
    await db.delete(conv)
    await db.commit()
    return {"detail": "Conversation deleted"}


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: UUID,
    data: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await _get_user_conversation(conversation_id, current_user.id, db)

    return StreamingResponse(
        stream_rag_response(db, conv, data.content, current_user.id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_user_conversation(conversation_id, current_user.id, db)

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at)
    )
    return result.scalars().all()


@router.get("/health")
async def chat_health():
    return {
        "groq_configured": bool(settings.GROQ_API_KEY),
        "jina_configured": bool(settings.JINA_API_KEY),
    }
