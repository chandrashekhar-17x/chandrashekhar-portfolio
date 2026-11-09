"""Shared test fixtures.

`client` is an async HTTP client that calls the app in-process (no real server),
so tests are fast and need no network.
"""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from portfolio_api.core.config import Settings
from portfolio_api.main import create_app


@pytest.fixture
def settings() -> Settings:
    return Settings(environment="test", cors_origins=["http://localhost:4200"])


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[AsyncClient]:
    app = create_app(settings)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
