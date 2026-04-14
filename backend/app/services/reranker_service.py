import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

JINA_RERANK_URL = "https://api.jina.ai/v1/rerank"
JINA_MODEL = "jina-reranker-v2-base-multilingual"


async def rerank(query: str, chunks: list[dict], top_k: int = 5) -> list[dict]:
    if not chunks or not settings.JINA_API_KEY:
        return chunks[:top_k]

    try:
        documents = [chunk["content"] for chunk in chunks]

        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                JINA_RERANK_URL,
                headers={
                    "Authorization": f"Bearer {settings.JINA_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": JINA_MODEL,
                    "query": query,
                    "documents": documents,
                    "top_n": top_k,
                },
            )
            response.raise_for_status()
            data = response.json()

        reranked = []
        for item in data.get("results", []):
            idx = item["index"]
            chunk = chunks[idx].copy()
            chunk["rerank_score"] = item["relevance_score"]
            reranked.append(chunk)

        return reranked

    except Exception as e:
        logger.warning(f"Jina reranker failed, using original order: {e}")
        return chunks[:top_k]
