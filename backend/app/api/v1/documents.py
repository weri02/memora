import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.database import get_db, async_session
from app.core.dependencies import get_current_user
from app.core.exceptions import NotFoundError, BadRequestError
from app.models.user import User
from app.models.document import Document, DocumentChunk
from app.schemas.document import DocumentResponse, DocumentStatsResponse
from app.services.indexing_service import index_document

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_TYPES = {"pdf", "docx", "txt"}


async def _run_indexing(document_id: int):
    async with async_session() as db:
        result = await db.execute(select(Document).where(Document.id == document_id))
        document = result.scalar_one_or_none()
        if document:
            await index_document(db, document)


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_TYPES:
        raise BadRequestError(f"File type '{ext}' not allowed. Use: {', '.join(ALLOWED_TYPES)}")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise BadRequestError(f"File too large. Max: {settings.MAX_FILE_SIZE // (1024*1024)}MB")

    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    with open(file_path, "wb") as f:
        f.write(content)

    document = Document(
        user_id=current_user.id,
        filename=unique_name,
        original_filename=file.filename,
        file_type=ext,
        file_size_bytes=len(content),
        file_path=file_path,
        status="pending",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    background_tasks.add_task(_run_indexing, document.id)

    return document


@router.get("/", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
    )
    return result.scalars().all()


@router.get("/stats", response_model=DocumentStatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = await db.execute(select(Document).where(Document.user_id == current_user.id))
    documents = docs.scalars().all()

    by_status: dict[str, int] = {}
    by_type: dict[str, int] = {}
    total_chunks = 0

    for doc in documents:
        by_status[doc.status] = by_status.get(doc.status, 0) + 1
        by_type[doc.file_type] = by_type.get(doc.file_type, 0) + 1
        total_chunks += doc.chunk_count

    return DocumentStatsResponse(
        total_documents=len(documents),
        total_chunks=total_chunks,
        by_status=by_status,
        by_type=by_type,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise NotFoundError("Document not found")
    return document


@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise NotFoundError("Document not found")

    if os.path.exists(document.file_path):
        os.remove(document.file_path)

    await db.delete(document)
    await db.commit()
    return {"detail": "Document deleted"}


@router.post("/{document_id}/reindex", response_model=DocumentResponse)
async def reindex_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == current_user.id)
    )
    document = result.scalar_one_or_none()
    if not document:
        raise NotFoundError("Document not found")

    await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))
    document.status = "pending"
    document.chunk_count = 0
    document.error_message = None
    await db.commit()
    await db.refresh(document)

    background_tasks.add_task(_run_indexing, document.id)

    return document
