"""App settings, loaded from environment variables (and .env in local dev).

pydantic-settings reads each field from an env var with the same name
(case-insensitive), converts it to the declared type and fails fast at
startup if something is missing or invalid. Think of it as a typed `.env`.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, RedisDsn, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["local", "test", "staging", "production"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # the shared .env also holds web/worker vars
    )

    app_name: str = "Chandrashekhar Portfolio API"
    environment: Environment = "local"
    debug: bool = False

    # Browsers may only call the API from these origins (never "*").
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:4200"])

    # Defaults match infra/docker-compose.yml for local development.
    database_url: PostgresDsn = PostgresDsn(
        "postgresql+asyncpg://portfolio:portfolio@localhost:5432/portfolio"
    )
    redis_url: RedisDsn = RedisDsn("redis://localhost:6379/0")

    # Secrets use SecretStr so they never show up in logs or tracebacks.
    anthropic_api_key: SecretStr | None = None
    openai_api_key: SecretStr | None = None

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    """Build settings once and reuse them (also easy to override in tests)."""
    return Settings()
