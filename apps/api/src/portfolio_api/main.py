"""App factory: builds and configures the FastAPI application.

Run locally with:
    uv run uvicorn portfolio_api.main:create_app --factory --reload
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from portfolio_api import __version__
from portfolio_api.api.routes import content, health
from portfolio_api.core.config import Settings, get_settings
from portfolio_api.core.errors import install_error_handlers
from portfolio_api.core.logging import configure_logging
from portfolio_api.core.request_id import HEADER, RequestIdMiddleware
from portfolio_api.db.redis import make_redis
from portfolio_api.db.session import make_engine, make_session_factory
from portfolio_api.services.cache import JsonCache


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging("DEBUG" if settings.debug else "INFO")

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        # Startup: create pools (they connect lazily). Shutdown: close them cleanly.
        yield
        await app.state.redis.aclose()
        await app.state.engine.dispose()

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        # Interactive API docs only outside production.
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        lifespan=lifespan,
    )
    # Routes read these from app.state (api/deps.py), never from global state.
    app.state.settings = settings
    app.state.engine = make_engine(settings)
    app.state.session_factory = make_session_factory(app.state.engine)
    app.state.redis = make_redis(settings)
    app.state.cache = JsonCache(app.state.redis, settings.content_cache_ttl)

    install_error_handlers(app)
    # CORS: let the Angular site (and only it) call this API from the browser.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
        expose_headers=[HEADER],
    )
    # Added last = runs first: every request (even CORS-rejected ones) gets an id.
    app.add_middleware(RequestIdMiddleware)

    app.include_router(health.router)
    app.include_router(content.router)
    return app
