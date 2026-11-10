"""Public read API on a seeded Postgres + real Redis (fixtures in conftest)."""

import json
from typing import Any

import pytest
from check_confidential import find_leaks
from gen_graph_fixture import OUT as GRAPH_FIXTURE
from gen_graph_fixture import expected_graph
from httpx import ASGITransport, AsyncClient
from pydantic import PostgresDsn, RedisDsn

from portfolio_api.core.config import REPO_ROOT, Settings
from portfolio_api.main import create_app
from portfolio_api.services.cache import PREFIX

DATA = REPO_ROOT / "content" / "data"
ROUTES = ["profile", "skills", "experience", "education", "about", "lab", "graph", "projects"]


def _file(name: str) -> Any:
    data = json.loads((DATA / f"{name}.json").read_text(encoding="utf-8"))
    data.pop("$schema", None)
    return data


async def test_endpoints_return_content_shapes(api: AsyncClient) -> None:
    expected = {
        "profile": _file("profile"),
        "skills": _file("skills")["skills"],
        "experience": _file("experience"),
        "education": _file("education")["education"],
        "about": _file("about"),
        "lab": _file("lab"),
        "projects": _file("projects")["projects"],
    }
    for name, value in expected.items():
        res = await api.get(f"/api/v1/{name}")
        assert res.status_code == 200, name
        assert res.json() == value, name


async def test_graph_matches_shared_fixture(api: AsyncClient) -> None:
    res = await api.get("/api/v1/graph")
    assert res.json() == json.loads(GRAPH_FIXTURE.read_text(encoding="utf-8"))


def test_graph_fixture_is_up_to_date() -> None:
    # Fails after a content change until `make graph-fixture` is re-run.
    assert expected_graph() == json.loads(GRAPH_FIXTURE.read_text(encoding="utf-8"))


async def test_featured_filter(api: AsyncClient) -> None:
    featured = (await api.get("/api/v1/projects", params={"featured": "true"})).json()
    assert featured
    assert all(p.get("featured") for p in featured)
    others = (await api.get("/api/v1/projects", params={"featured": "false"})).json()
    assert len(featured) + len(others) == len(_file("projects")["projects"])


async def test_project_detail_includes_case_study(api: AsyncClient) -> None:
    project = _file("projects")["projects"][0]
    res = await api.get(f"/api/v1/projects/{project['slug']}")
    body = res.json()
    assert body["slug"] == project["slug"]
    assert body["bodyMarkdown"] == (REPO_ROOT / "content" / project["body"]).read_text("utf-8")


async def test_unknown_project_is_404_with_error_shape(api: AsyncClient) -> None:
    res = await api.get("/api/v1/projects/does-not-exist")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"
    bad = await api.get("/api/v1/projects/Bad_Slug!")
    assert bad.status_code == 422


async def test_etag_gives_304_when_unchanged(api: AsyncClient) -> None:
    first = await api.get("/api/v1/skills")
    etag = first.headers["etag"]
    assert "max-age" in first.headers["cache-control"]
    again = await api.get("/api/v1/skills", headers={"If-None-Match": etag})
    assert again.status_code == 304
    assert again.content == b""
    stale = await api.get("/api/v1/skills", headers={"If-None-Match": '"old"'})
    assert stale.status_code == 200


async def test_responses_are_cached_in_redis(api: AsyncClient) -> None:
    await api.get("/api/v1/about")
    redis = api._transport.app.state.redis  # type: ignore[attr-defined]
    assert await redis.exists(PREFIX + "about") == 1


async def test_api_still_works_when_redis_is_down(seeded_url: str) -> None:
    settings = Settings(
        environment="test",
        database_url=PostgresDsn(seeded_url),
        redis_url=RedisDsn("redis://127.0.0.1:1/0"),
    )
    app = create_app(settings)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/profile")
    await app.state.engine.dispose()
    assert res.status_code == 200


@pytest.mark.parametrize("route", ROUTES)
async def test_no_confidential_names_in_responses(api: AsyncClient, route: str) -> None:
    res = await api.get(f"/api/v1/{route}")
    assert find_leaks(res.text) == []
