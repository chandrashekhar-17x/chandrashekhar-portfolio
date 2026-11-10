"""Small JSON response cache in Redis for the public read API.

Content changes rarely (a seed or, later, an admin edit), but every page view
reads it, so finished JSON bytes are kept in Redis for `ttl` seconds.
`make seed` clears the keys, so new content shows up immediately.

Fail-open: if Redis is down, requests go straight to the database. A cache
must never be the reason the site is broken.
"""

import json
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from redis.asyncio import Redis
from redis.exceptions import RedisError

PREFIX = "content:v1:"
log = logging.getLogger(__name__)


def dump(data: Any) -> bytes:
    """Compact, stable JSON (same input → same bytes → same ETag)."""
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode()


class JsonCache:
    def __init__(self, redis: "Redis", ttl: int) -> None:
        self._redis = redis
        self._ttl = ttl

    async def get_or_build(
        self, key: str, build: Callable[[], Awaitable[Any | None]]
    ) -> bytes | None:
        """Cached bytes for `key`, else `build()` them. None (not found) isn't cached."""
        try:
            hit = await self._redis.get(PREFIX + key)
        except (RedisError, OSError) as exc:
            log.warning("cache read failed: %s", exc.__class__.__name__)
            hit = None
        if hit is not None:
            # decode_responses may be on (see db/redis.py): accept str too.
            return hit.encode() if isinstance(hit, str) else hit
        data = await build()
        if data is None:
            return None
        body = dump(data)
        try:
            await self._redis.set(PREFIX + key, body, ex=self._ttl)
        except (RedisError, OSError) as exc:
            log.warning("cache write failed: %s", exc.__class__.__name__)
        return body


async def clear_content_cache(redis: "Redis") -> int:
    """Delete every cached content response; returns how many keys went."""
    keys = [k async for k in redis.scan_iter(match=PREFIX + "*", count=200)]
    if keys:
        await redis.delete(*keys)
    return len(keys)
