"""Readiness checks: can the app reach the things it needs to serve requests?

Each check is an async function that returns nothing on success and raises on
failure, so the route can run them all concurrently with a time limit.
"""

import asyncio
from collections.abc import Awaitable, Callable
from typing import Literal

from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

Probe = Callable[[], Awaitable[None]]
Status = Literal["ok", "unavailable"]
TIMEOUT_S = 2.0


def database_probe(engine: AsyncEngine) -> Probe:
    async def probe() -> None:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

    return probe


def redis_probe(redis: "Redis") -> Probe:
    async def probe() -> None:
        await redis.ping()

    return probe


async def run_probes(probes: dict[str, Probe]) -> dict[str, Status]:
    """{"database": "ok", "redis": "unavailable"}; never raises."""

    async def one(probe: Probe) -> Status:
        try:
            await asyncio.wait_for(probe(), TIMEOUT_S)
        except Exception:  # any failure means "not ready"; details go nowhere public
            return "unavailable"
        return "ok"

    names = list(probes)
    results = await asyncio.gather(*(one(probes[n]) for n in names))
    return dict(zip(names, results, strict=True))
