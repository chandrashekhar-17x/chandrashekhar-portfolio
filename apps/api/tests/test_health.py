import asyncio

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient, Response

from portfolio_api import __version__
from portfolio_api.api.deps import get_readiness_probes
from portfolio_api.core.config import Settings
from portfolio_api.main import create_app
from portfolio_api.services import health as health_service
from portfolio_api.services.health import Probe


async def test_liveness_returns_ok(client: AsyncClient) -> None:
    for path in ("/health", "/health/live"):
        response = await client.get(path)
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "version": __version__, "environment": "test"}


async def test_cors_allows_only_listed_origin(client: AsyncClient) -> None:
    allowed = await client.get("/health", headers={"Origin": "http://localhost:4200"})
    blocked = await client.get("/health", headers={"Origin": "https://evil.example"})

    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:4200"
    assert "access-control-allow-origin" not in blocked.headers


async def ok() -> None:
    return None


async def down() -> None:
    raise ConnectionError("refused")


async def slow() -> None:
    await asyncio.sleep(5)


async def ready(settings: Settings, probes: dict[str, Probe]) -> Response:
    """GET /health/ready on an app whose dependency checks are replaced by fakes."""
    app: FastAPI = create_app(settings)
    app.dependency_overrides[get_readiness_probes] = lambda: probes
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        return await ac.get("/health/ready")


async def test_ready_when_every_dependency_answers(settings: Settings) -> None:
    response = await ready(settings, {"database": ok, "redis": ok})
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "checks": {"database": "ok", "redis": "ok"}}


async def test_not_ready_names_the_failing_dependency(settings: Settings) -> None:
    response = await ready(settings, {"database": ok, "redis": down})
    assert response.status_code == 503
    assert response.json()["checks"] == {"database": "ok", "redis": "unavailable"}
    assert "refused" not in response.text  # no internal details


async def test_a_hanging_dependency_times_out(
    settings: Settings, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(health_service, "TIMEOUT_S", 0.05)
    response = await ready(settings, {"database": slow, "redis": ok})
    assert response.status_code == 503
    assert response.json()["checks"]["database"] == "unavailable"
