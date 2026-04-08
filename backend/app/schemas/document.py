from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    file_size_bytes: int
    status: str
    chunk_count: int
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentStatsResponse(BaseModel):
    total_documents: int
    total_chunks: int
    by_status: dict[str, int]
    by_type: dict[str, int]
