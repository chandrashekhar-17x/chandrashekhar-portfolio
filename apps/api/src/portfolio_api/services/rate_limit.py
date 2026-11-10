"""Fixed-window rate limit in Redis: at most `limit` hits per `window` seconds per key.

INCR counts the hit; the first hit also sets the expiry, so the counter
resets by itself when the window ends. Fail-open: if Redis is down the
request is allowed (Turnstile still blocks bots), so an outage of the
cache never takes the contact form down with it.
"""

import logging

from redis.asyncio import Redis
from redis.exceptions import RedisError

log = logging.getLogger(__name__)


async def retry_after(redis: "Redis", key: str, *, limit: int, window: int) -> int | None:
    """Count one hit. None = allowed; otherwise seconds until the next allowed hit."""
    try:
        count = int(await redis.incr(key))
        if count == 1:
            await redis.expire(key, window)
        if count <= limit:
            return None
        ttl = int(await redis.ttl(key))
        return ttl if ttl > 0 else window
    except (RedisError, OSError) as exc:
        log.warning("rate limit unavailable: %s", exc.__class__.__name__)
        return None
