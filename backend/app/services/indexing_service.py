import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentChunk
from app.services.document_service import extract_text
from app.services.embedding_service import get_embeddings_batch

logger = logging.getLogger(__name__)

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def _chunk_text(text: str) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        if end < len(text):
            space_idx = text.rfind(" ", start, end)
            if space_idx > start:
                end = space_idx
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - CHUNK_OVERLAP if end < len(text) else end
    return chunks


def _build_header(document: Document, section: str = "") -> str:
    parts = [f"[DOCUMENT: {document.original_filename}]", f"[TYPE: {document.file_type.upper()}]"]
    if section:
        parts.append(f"[SECTION: {section}]")
    return " ".join(parts)


def _detect_section(text: str) -> str:
    for line in text.split("\n"):
        line = line.strip()
        if line.startswith("#"):
            return line.lstrip("#").strip()
        if line.startswith("[Page"):
            return line
    return ""


async def index_document(db: AsyncSession, document: Document) -> None:
    document.status = "processing"
    await db.commit()

    try:
        text = await asyncio.to_thread(extract_text, document.file_path, document.file_type)

        if not text.strip():
            document.status = "error"
            document.error_message = "No text content extracted"
            await db.commit()
            return

        chunks = _chunk_text(text)
        header = _build_header(document)

        embedding_texts = [f"{header}\n{chunk}" for chunk in chunks]
        embeddings = await get_embeddings_batch(embedding_texts)

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            section = _detect_section(chunk)
            db_chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=i,
                content=chunk,
                embedding=embedding,
                metadata_={
                    "document_name": document.original_filename,
                    "file_type": document.file_type,
                    "section": section,
                    "chunk_index": i,
                },
            )
            db.add(db_chunk)

        document.chunk_count = len(chunks)
        document.status = "indexed"
        await db.commit()

        logger.info(f"Indexed document {document.id}: {len(chunks)} chunks")

    except Exception as e:
        logger.error(f"Error indexing document {document.id}: {e}")
        document.status = "error"
        document.error_message = str(e)[:500]
        await db.commit()
