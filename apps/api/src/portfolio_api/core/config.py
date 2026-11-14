"""App settings, loaded from environment variables (and .env in local dev).

pydantic-settings reads each field from an env var with the same name
(case-insensitive), converts it to the declared type and fails fast at
startup if something is missing or invalid. Think of it as a typed `.env`.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field, PostgresDsn, RedisDsn, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Repo root: apps/api/src/portfolio_api/core/config.py → 5 levels up.
REPO_ROOT = Path(__file__).resolve().parents[5]

Environment = Literal["local", "test", "staging", "production"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",  # the shared .env also holds web/worker vars
        env_ignore_empty=True,  # `KEY=` in .env means "not set", not ""
    )

    app_name: str = "Chandrashekhar Portfolio API"
    environment: Environment = "local"
    debug: bool = False

    # Browsers may only call the API from these origins (never "*").
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:4200"])

    # Defaults match infra/docker-compose.yml for local development.
    database_url: PostgresDsn = PostgresDsn(
        "postgresql+asyncpg://portfolio:portfolio@localhost:5433/portfolio"
    )
    redis_url: RedisDsn = RedisDsn("redis://localhost:6380/0")

    # Seed source for `make seed` (the database is the source of truth after seeding).
    content_dir: Path = REPO_ROOT / "content"
    # Seconds a public content response stays in Redis (`make seed` clears it).
    content_cache_ttl: int = 300

    # Contact form. Without the Turnstile secret the bot check is off (local dev);
    # without Resend settings messages are only stored ("log only" mode).
    turnstile_secret_key: SecretStr | None = None
    resend_api_key: SecretStr | None = None
    contact_to_email: str | None = None
    contact_from_email: str | None = None
    contact_limit_per_hour: int = 3
    # Visitor IPs are stored only as salted hashes; set a long random value in production.
    ip_hash_salt: SecretStr = SecretStr("local-dev-salt")

    # Secrets use SecretStr so they never show up in logs or tracebacks.
    anthropic_api_key: SecretStr | None = None
    openai_api_key: SecretStr | None = None

    @field_validator("database_url", mode="before")
    @classmethod
    def _asyncpg_url(cls, value: object) -> object:
        return asyncpg_url(value) if isinstance(value, str) else value

    @property
    def email_enabled(self) -> bool:
        return bool(self.resend_api_key and self.contact_to_email and self.contact_from_email)

    @model_validator(mode="after")
    def _production_needs_real_salt(self) -> "Settings":
        if self.environment == "production" and self.ip_hash_salt.get_secret_value() == (
            "local-dev-salt"
        ):
            raise ValueError("IP_HASH_SALT must be set in production")
        return self

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


# libpq options (what Neon/Render print) that asyncpg doesn't understand.
_LIBPQ_ONLY = {"channel_binding", "options", "target_session_attrs"}


def asyncpg_url(url: str) -> str:
    """Accept the connection string a host gives you, as is.

    Hosts print `postgres://…?sslmode=require&channel_binding=require` (libpq style).
    SQLAlchemy needs the `postgresql+asyncpg://` driver prefix, and asyncpg spells
    TLS `ssl=require` and rejects the other libpq-only options.
    """
    parts = urlsplit(url)
    scheme = parts.scheme
    if scheme in {"postgres", "postgresql"}:
        scheme = "postgresql+asyncpg"
    query = []
    for key, val in parse_qsl(parts.query):
        if key == "sslmode":
            query.append(("ssl", val))
        elif key not in _LIBPQ_ONLY:
            query.append((key, val))
    return urlunsplit(parts._replace(scheme=scheme, query=urlencode(query)))


@lru_cache
def get_settings() -> Settings:
    """Build settings once and reuse them (also easy to override in tests)."""
    return Settings()
