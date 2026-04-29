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


class SourceExcerpt(BaseModel):
    chunk_id: int
    preview: str
    score: float | None = None
    rerank_score: float | None = None


class SourceResponse(BaseModel):
    document_name: str
    excerpts: list[SourceExcerpt]
    best_score: float | None = None


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
