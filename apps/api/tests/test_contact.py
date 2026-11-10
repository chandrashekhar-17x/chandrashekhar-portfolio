"""POST /api/v1/contact on real Postgres + Redis; Turnstile and Resend are faked."""

import json
from collections.abc import AsyncIterator, Callable
from typing import Any

import httpx
import pytest
from pydantic import PostgresDsn, RedisDsn, SecretStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from portfolio_api.core.config import Settings
from portfolio_api.db.models import ContactMessage
from portfolio_api.main import create_app

FORM = {"name": "Ada", "email": "ada@example.com", "reason": "hiring", "message": "Hello there!"}
Make = Callable[..., Any]


@pytest.fixture
def outgoing() -> list[httpx.Request]:
    return []


@pytest.fixture
async def make_client(database_url: str, outgoing: list[httpx.Request]) -> AsyncIterator[Make]:
    """Build a client with extra settings; records outgoing HTTP calls."""
    apps: list[Any] = []

    def handler(req: httpx.Request) -> httpx.Response:
        outgoing.append(req)
        if "turnstile" in str(req.url):
            return httpx.Response(200, json={"success": b"good-token" in req.content})
        return httpx.Response(200, json={"id": "email_1"})

    async def make(**overrides: Any) -> httpx.AsyncClient:
        settings = Settings(
            environment="test",
            database_url=PostgresDsn(database_url),
            redis_url=RedisDsn("redis://localhost:6380/15"),
            **overrides,
        )
        app = create_app(settings)
        try:
            await app.state.redis.flushdb()
        except OSError:
            pytest.skip("Redis not reachable; run `make up`")
        app.state.http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        apps.append(app)
        return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")

    yield make
    for app in apps:
        await app.state.redis.aclose()
        await app.state.engine.dispose()


async def _stored(database_url: str) -> list[ContactMessage]:
    engine = create_async_engine(database_url)
    async with AsyncSession(engine) as s:
        rows = list((await s.scalars(select(ContactMessage))).all())
        for r in rows:
            await s.delete(r)
        await s.commit()
    await engine.dispose()
    return rows


async def test_stores_message_in_log_only_mode(make_client: Make, database_url: str) -> None:
    client = await make_client()
    res = await client.post("/api/v1/contact", json=FORM)
    assert res.status_code == 202
    assert res.json() == {"status": "received"}
    [row] = await _stored(database_url)
    assert (row.name, row.status) == ("Ada", "stored")
    assert len(row.ip_hash) == 64  # hashed, not the raw IP


async def test_emails_when_resend_is_configured(
    make_client: Make, database_url: str, outgoing: list[httpx.Request]
) -> None:
    client = await make_client(
        resend_api_key=SecretStr("re_test"),
        contact_to_email="owner@example.com",
        contact_from_email="site@example.com",
    )
    assert (await client.post("/api/v1/contact", json=FORM)).status_code == 202
    [email] = outgoing
    sent = json.loads(email.content)
    assert sent["reply_to"] == "ada@example.com"
    assert sent["to"] == ["owner@example.com"]
    assert email.headers["authorization"] == "Bearer re_test"
    [row] = await _stored(database_url)
    assert row.status == "emailed"


async def test_turnstile_required_when_configured(make_client: Make, database_url: str) -> None:
    client = await make_client(turnstile_secret_key=SecretStr("ts"))
    missing = await client.post("/api/v1/contact", json=FORM)
    assert missing.status_code == 400
    bad = await client.post("/api/v1/contact", json=FORM | {"turnstile_token": "bad"})
    assert bad.status_code == 400
    good = await client.post("/api/v1/contact", json=FORM | {"turnstile_token": "good-token"})
    assert good.status_code == 202
    assert len(await _stored(database_url)) == 1


async def test_rate_limited_after_three_per_hour(make_client: Make, database_url: str) -> None:
    client = await make_client()
    codes = [(await client.post("/api/v1/contact", json=FORM)).status_code for _ in range(4)]
    assert codes == [202, 202, 202, 429]
    last = await client.post("/api/v1/contact", json=FORM)
    assert last.json()["error"]["code"] == "TOO_MANY_REQUESTS"
    assert int(last.headers["retry-after"]) > 0
    assert len(await _stored(database_url)) == 3


async def test_honeypot_pretends_success_and_stores_nothing(
    make_client: Make, database_url: str
) -> None:
    client = await make_client()
    res = await client.post("/api/v1/contact", json=FORM | {"website": "http://spam"})
    assert res.status_code == 202
    assert await _stored(database_url) == []


@pytest.mark.parametrize(
    "change",
    [
        {"email": "not-an-email"},
        {"message": "short"},
        {"name": "Line\nBreak"},
        {"reason": "spam"},
        {"extra": "field"},
    ],
)
async def test_invalid_input_is_422(make_client: Make, change: dict[str, str]) -> None:
    client = await make_client()
    res = await client.post("/api/v1/contact", json=FORM | change)
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"


def test_production_requires_real_ip_salt() -> None:
    with pytest.raises(ValueError, match="IP_HASH_SALT"):
        Settings(environment="production")
