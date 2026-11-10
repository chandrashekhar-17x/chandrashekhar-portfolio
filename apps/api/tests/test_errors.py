from collections.abc import AsyncIterator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from portfolio_api.core.config import Settings
from portfolio_api.main import create_app


@pytest.fixture
async def app_client(settings: Settings) -> AsyncIterator[AsyncClient]:
    app: FastAPI = create_app(settings)

    @app.get("/boom")
    async def boom() -> None:
        raise RuntimeError("secret internal detail")

    @app.get("/items/{item_id}")
    async def item(item_id: int) -> dict[str, int]:
        return {"id": item_id}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


async def test_unknown_route_uses_the_error_shape(app_client: AsyncClient) -> None:
    response = await app_client.get("/nope")

    assert response.status_code == 404
    error = response.json()["error"]
    assert error["code"] == "NOT_FOUND"
    assert error["request_id"] == response.headers["x-request-id"]


async def test_validation_errors_name_the_field(app_client: AsyncClient) -> None:
    response = await app_client.get("/items/not-a-number")

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert "item_id" in response.json()["error"]["message"]


async def test_unexpected_errors_hide_details_but_keep_the_request_id(
    app_client: AsyncClient,
) -> None:
    response = await app_client.get("/boom")

    assert response.status_code == 500
    body = response.json()["error"]
    assert "secret" not in body["message"]
    assert body["request_id"] == response.headers["x-request-id"]
