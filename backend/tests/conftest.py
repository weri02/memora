"""Configuracion compartida para los tests unitarios."""

import os

os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("JINA_API_KEY", "test-jina-key")
os.environ.setdefault("EMBEDDING_MODEL", "test-model")
