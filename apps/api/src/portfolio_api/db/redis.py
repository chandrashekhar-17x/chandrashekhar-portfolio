"""Redis client (cache + rate limits). One client per app; it pools connections."""

from redis.asyncio import Redis

from portfolio_api.core.config import Settings


def make_redis(settings: Settings) -> "Redis":
    # Lazy: no connection until the first command. Short timeouts so a slow
    # Redis degrades one request instead of hanging it.
    return Redis.from_url(
        str(settings.redis_url),
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )
