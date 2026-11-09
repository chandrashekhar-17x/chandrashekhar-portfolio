"""App factory: builds and configures the FastAPI application.

Run locally with:
    uv run uvicorn portfolio_api.main:create_app --factory --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from portfolio_api import __version__
from portfolio_api.api.routes import health
from portfolio_api.core.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=__version__,
        # Interactive API docs only outside production.
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
    )
    # Routes read settings from here (api/deps.py), never from global state.
    app.state.settings = settings

    # CORS: let the Angular site (and only it) call this API from the browser.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    )

    app.include_router(health.router)
    return app
