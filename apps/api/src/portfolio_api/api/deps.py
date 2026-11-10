"""Reusable FastAPI dependencies.

A dependency is a function FastAPI calls for you before a route runs; its return
value is passed into the route. `Annotated[...]` aliases keep route signatures short.
Everything comes from `app.state` (set up in main.py), never from module globals,
so tests can build an app with fakes.
"""

from collections.abc import AsyncIterator
from typing import Annotated, cast

from fastapi import Depends, Request
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from portfolio_api.core.config import Settings
from portfolio_api.db.session import session_scope
from portfolio_api.services.cache import JsonCache
from portfolio_api.services.health import Probe, database_probe, redis_probe


def get_app_settings(request: Request) -> Settings:
    # The settings the app was built with (see main.create_app).
    return cast(Settings, request.app.state.settings)


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    factory = cast(async_sessionmaker[AsyncSession], request.app.state.session_factory)
    async for session in session_scope(factory):
        yield session


def get_redis(request: Request) -> "Redis":
    return cast("Redis", request.app.state.redis)


def get_cache(request: Request) -> JsonCache:
    return cast(JsonCache, request.app.state.cache)


def get_readiness_probes(request: Request) -> dict[str, Probe]:
    return {
        "database": database_probe(request.app.state.engine),
        "redis": redis_probe(request.app.state.redis),
    }


SettingsDep = Annotated[Settings, Depends(get_app_settings)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]
RedisDep = Annotated["Redis", Depends(get_redis)]
CacheDep = Annotated[JsonCache, Depends(get_cache)]
ProbesDep = Annotated[dict[str, Probe], Depends(get_readiness_probes)]
