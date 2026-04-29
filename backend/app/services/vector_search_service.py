import uuid
import logging

from rank_bm25 import BM25Okapi
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.embedding_service import get_embedding

logger = logging.getLogger(__name__)


async def search_similar(
    db: AsyncSession,
    query: str,
    user_id: uuid.UUID,
    document_ids: list[int] | None = None,
    top_k: int = 20,
    min_score: float = 0.3,
) -> list[dict]:
    query_embedding = await get_embedding(query)
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    doc_filter = ""
    params: dict = {
        "embedding": embedding_str,
        "user_id": str(user_id),
        "top_k": top_k,
        "min_score": min_score,
    }

    if document_ids:
        doc_filter = "AND d.id = ANY(:document_ids::int[])"
        params["document_ids"] = document_ids

    sql = text(f"""
        SELECT
            dc.id,
            dc.document_id,
            dc.chunk_index,
            dc.content,
            dc.metadata,
            1 - (dc.embedding <=> cast(:embedding AS vector)) AS score
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE d.user_id = cast(:user_id AS uuid)
        {doc_filter}
        AND 1 - (dc.embedding <=> cast(:embedding AS vector)) >= :min_score
        ORDER BY score DESC
        LIMIT :top_k
    """)

    result = await db.execute(sql, params)
    rows = result.fetchall()

    return [
        {
            "chunk_id": row.id,
            "document_id": row.document_id,
            "chunk_index": row.chunk_index,
            "content": row.content,
            "metadata": row.metadata,
            "score": float(row.score),
        }
        for row in rows
    ]


def _bm25_rerank(query: str, chunks: list[dict]) -> list[dict]:
    if not chunks:
        return chunks

    tokenized_corpus = [chunk["content"].lower().split() for chunk in chunks]
    bm25 = BM25Okapi(tokenized_corpus)
    tokenized_query = query.lower().split()
    bm25_scores = bm25.get_scores(tokenized_query)

    for i, chunk in enumerate(chunks):
        chunk["bm25_score"] = float(bm25_scores[i])

    return chunks


def _rrf_fusion(chunks: list[dict], k: int = 60) -> list[dict]:
    if not chunks:
        return chunks

    sorted_by_vector = sorted(chunks, key=lambda x: x["score"], reverse=True)
    sorted_by_bm25 = sorted(chunks, key=lambda x: x.get("bm25_score", 0), reverse=True)

    rrf_scores = {}
    for rank, chunk in enumerate(sorted_by_vector):
        cid = chunk["chunk_id"]
        rrf_scores[cid] = rrf_scores.get(cid, 0) + 1 / (k + rank + 1)

    for rank, chunk in enumerate(sorted_by_bm25):
        cid = chunk["chunk_id"]
        rrf_scores[cid] = rrf_scores.get(cid, 0) + 1 / (k + rank + 1)

    for chunk in chunks:
        chunk["rrf_score"] = rrf_scores[chunk["chunk_id"]]

    return sorted(chunks, key=lambda x: x["rrf_score"], reverse=True)


async def search_for_rag(
    db: AsyncSession,
    query: str,
    user_id: uuid.UUID,
    document_ids: list[int] | None = None,
    top_k: int = 15,
) -> list[dict]:
    candidates = await search_similar(db, query, user_id, document_ids, top_k=30, min_score=0.3)

    if not candidates:
        return []

    candidates = _bm25_rerank(query, candidates)
    ranked = _rrf_fusion(candidates)

    return ranked[:top_k]
