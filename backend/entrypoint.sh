#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
while ! python -c "
import asyncio, asyncpg, os
async def check():
    conn = await asyncpg.connect(os.environ['DATABASE_URL'].replace('+asyncpg', ''))
    await conn.close()
asyncio.run(check())
" 2>/dev/null; do
    sleep 1
done
echo "PostgreSQL is ready!"

echo "Preloading embedding model..."
python -c "
from sentence_transformers import SentenceTransformer
import os
model_name = os.environ.get('EMBEDDING_MODEL', 'BAAI/bge-m3')
model = SentenceTransformer(model_name, cache_folder='/app/models_cache')
model.encode(['test'])
print(f'Model {model_name} loaded successfully!')
"

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
