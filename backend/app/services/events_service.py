import asyncio
import logging
import uuid
from collections import defaultdict

logger = logging.getLogger(__name__)
_subscribers: dict[uuid.UUID, list[asyncio.Queue]] = defaultdict(list)


async def subscribe(user_id: uuid.UUID) -> asyncio.Queue:
    """Registra una nueva cola para un cliente SSE recien conectado"""
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers[user_id].append(queue)
    return queue


def unsubscribe(user_id: uuid.UUID, queue: asyncio.Queue) -> None:
    """Elimina la cola cuando el cliente desconecta"""
    if queue in _subscribers.get(user_id, []):
        _subscribers[user_id].remove(queue)
    if user_id in _subscribers and not _subscribers[user_id]:
        del _subscribers[user_id]


async def publish_document_status(
    user_id: uuid.UUID,
    document_id: int,
    status: str,
    chunk_count: int | None = None,
) -> None:
    """Publica un evento de cambio de estado a todas las colas del usuario"""
    event = {
        "type": "document_status",
        "document_id": document_id,
        "status": status,
        "chunk_count": chunk_count,
    }
    for queue in list(_subscribers.get(user_id, [])):
        try:
            queue.put_nowait(event)
        except asyncio.QueueFull:
            logger.warning(f"Cola SSE llena para user {user_id}, evento descartado")
