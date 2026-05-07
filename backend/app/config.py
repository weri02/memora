from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str = "postgresql+asyncpg://ragdocs:ragdocs_pass@localhost:5432/ragdocs_db"

    # Autenticación
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_EXPIRATION_HOURS: int = 24

    # LLM
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Reranker
    JINA_API_KEY: str = ""

    # Embedding
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    EMBEDDING_DIMS: int = 1024
    MODELS_CACHE_DIR: str = "/app/models_cache"

    # Subida de archivos
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
