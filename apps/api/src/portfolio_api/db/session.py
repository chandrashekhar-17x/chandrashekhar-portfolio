"""Database engine and sessions (SQLAlchemy 2, async, asyncpg driver).

- The *engine* owns a pool of connections; one per app, created at startup.
- A *session* is a short unit of work; one per request, closed afterwards.
"""

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from portfolio_api.core.config import Settings


def make_engine(settings: Settings) -> AsyncEngine:
    # Creating the engine does not connect yet; the first query does.
    return create_async_engine(
        str(settings.database_url),
        pool_size=5,
        max_overflow=5,
        pool_pre_ping=True,  # drop dead connections (e.g. after a DB restart)
        pool_recycle=1800,
    )


def make_session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    # expire_on_commit=False: objects stay readable after commit (handy for responses).
    return async_sessionmaker(engine, expire_on_commit=False)


async def session_scope(factory: async_sessionmaker[AsyncSession]) -> AsyncIterator[AsyncSession]:
    async with factory() as session:
        yield session
