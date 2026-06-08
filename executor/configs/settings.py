from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Async Execution System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database — set DATABASE_URL directly to override the PostgreSQL default.
    # For local dev with SQLite:  DATABASE_URL=sqlite+aiosqlite:///./test.db
    # For production:             DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db
    DATABASE_URL: Optional[str] = None

    # PostgreSQL credentials (used only when DATABASE_URL is not set)
    POSTGRES_USER: str = "executor_user"
    POSTGRES_PASSWORD: str = "executor_password"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "executor_db"

    def model_post_init(self, __context) -> None:
        """Build DATABASE_URL from components if not explicitly set."""
        if self.DATABASE_URL is None:
            self.DATABASE_URL = (
                f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_URL: Optional[str] = None

    def __init__(self, **data):
        super().__init__(**data)
        if self.REDIS_URL is None:
            self.REDIS_URL = f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        
    # Worker Configuration
    WORKER_CONCURRENCY: int = 100
    WORKER_HEARTBEAT_INTERVAL: int = 5
    WORKER_TIMEOUT: int = 30
    
    # Rate Limiting & Retry
    DEFAULT_MAX_RETRIES: int = 3
    DEFAULT_RETRY_BACKOFF: float = 2.0
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")


settings = Settings()
