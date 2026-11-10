"""Shared test fixtures.

`client` is an async HTTP client that calls the app in-process (no real server),
so tests are fast and need no network.
"""

import asyncio
import os
import secrets
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from pydantic import PostgresDsn, RedisDsn
from redis.exceptions import RedisError
from sqlalchemy import make_url, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from portfolio_api.content.loader import load_content
from portfolio_api.content.seed import seed
from portfolio_api.core.config import REPO_ROOT, Settings, get_settings
from portfolio_api.main import create_app
from portfolio_api.services.cache import clear_content_cache


@pytest.fixture(autouse=True)
def isolated_settings(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Iterator[None]:
    """Keep developer .env files and inherited settings out of every API test."""
    monkeypatch.chdir(tmp_path)
    for name in tuple(os.environ):
        if name.lower() in Settings.model_fields:
            monkeypatch.delenv(name)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def settings() -> Settings:
    return Settings(environment="test", cors_origins=["http://localhost:4200"])


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    app = create_app(settings)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------- Real Postgres for database tests ----------
# Each test run creates its own throwaway database (portfolio_test_<random>) on the
# server in TEST_DATABASE_URL, migrates it with Alembic and drops it at the end.
# Locally that is the `make up` container; in CI a Postgres service container.
# Without a reachable server the DB tests are skipped, unless REQUIRE_DB=1 (CI).

ADMIN_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+asyncpg://portfolio:portfolio@localhost:5433/portfolio"
)
ALEMBIC_INI = Path(__file__).resolve().parents[1] / "alembic.ini"


async def _admin(sql: str) -> None:
    # CREATE/DROP DATABASE can't run inside a transaction: use AUTOCOMMIT.
    engine = create_async_engine(ADMIN_URL, isolation_level="AUTOCOMMIT")
    try:
        async with engine.connect() as conn:
            await conn.execute(text(sql))
    finally:
        await engine.dispose()


def alembic_config(url: str) -> Config:
    config = Config(str(ALEMBIC_INI))
    config.attributes["url"] = url
    config.attributes["configure_logger"] = False
    return config


@pytest.fixture(scope="session")
def database_url() -> Iterator[str]:
    name = f"portfolio_test_{secrets.token_hex(4)}"
    try:
        asyncio.run(_admin(f'CREATE DATABASE "{name}"'))
    except (OSError, SQLAlchemyError) as exc:
        if os.environ.get("REQUIRE_DB") == "1":
            raise
        pytest.skip(f"Postgres not reachable ({exc.__class__.__name__}); run `make up`")
    url = make_url(ADMIN_URL).set(database=name).render_as_string(hide_password=False)
    command.upgrade(alembic_config(url), "head")
    yield url
    asyncio.run(_admin(f'DROP DATABASE "{name}" WITH (FORCE)'))


@pytest.fixture
def alembic_cfg(database_url: str) -> Config:
    return alembic_config(database_url)


@pytest.fixture
async def db(database_url: str) -> AsyncIterator[AsyncSession]:
    """A session whose changes are rolled back after the test (clean DB per test)."""
    engine = create_async_engine(database_url)
    async with engine.connect() as conn:
        trans = await conn.begin()
        session = AsyncSession(bind=conn, join_transaction_mode="create_savepoint")
        try:
            yield session
        finally:
            await session.close()
            await trans.rollback()
    await engine.dispose()


TEST_REDIS_URL = os.environ.get("TEST_REDIS_URL", "redis://localhost:6380/15")


async def _seed_committed(url: str) -> None:
    engine = create_async_engine(url)
    try:
        async with AsyncSession(engine) as session, session.begin():
            await seed(session, load_content(REPO_ROOT / "content"))
    finally:
        await engine.dispose()


@pytest.fixture(scope="module")
def seeded_url(database_url: str) -> str:
    """The test database with content/ seeded and committed (for API tests)."""
    asyncio.run(_seed_committed(database_url))
    return database_url


@pytest.fixture
async def api(seeded_url: str) -> AsyncIterator[AsyncClient]:
    """Client for an app wired to the seeded test database and a test Redis db."""
    app_settings = Settings(
        environment="test", database_url=PostgresDsn(seeded_url), redis_url=RedisDsn(TEST_REDIS_URL)
    )
    app = create_app(app_settings)
    try:
        await clear_content_cache(app.state.redis)
    except (RedisError, OSError):
        if os.environ.get("REQUIRE_DB") == "1":
            raise
        pytest.skip("Redis not reachable; run `make up`")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    await app.state.redis.aclose()
    await app.state.engine.dispose()
