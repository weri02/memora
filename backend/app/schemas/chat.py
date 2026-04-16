from uuid import UUID
from datetime import datetime

from pydantic import BaseModel


class CreateConversationRequest(BaseModel):
    titulo: str | None = None
    document_ids: list[int] | None = None


class UpdateConversationRequest(BaseModel):
    titulo: str | None = None
    document_ids: list[int] | None = None


class SendMessageRequest(BaseModel):
    content: str


class SourceResponse(BaseModel):
    chunk_id: int
    score: float | None = None
    rerank_score: float | None = None
    preview: str
    document_name: str


class MessageResponse(BaseModel):
    id: int
    conversation_id: UUID
    role: str
    content: str
    sources: list[SourceResponse] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: UUID
    titulo: str | None = None
    document_ids: list[int] | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetailResponse(ConversationResponse):
    messages: list[MessageResponse] = []
