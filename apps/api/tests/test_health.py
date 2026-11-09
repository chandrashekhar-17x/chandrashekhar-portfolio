from httpx import AsyncClient

from portfolio_api import __version__


async def test_liveness_returns_ok(client: AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": __version__, "environment": "test"}


async def test_cors_allows_only_listed_origin(client: AsyncClient) -> None:
    allowed = await client.get("/health", headers={"Origin": "http://localhost:4200"})
    blocked = await client.get("/health", headers={"Origin": "https://evil.example"})

    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:4200"
    assert "access-control-allow-origin" not in blocked.headers
