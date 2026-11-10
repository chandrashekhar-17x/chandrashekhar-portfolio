"""Seed + migrations against a real Postgres (see the `db` fixture in conftest)."""

import copy
import json

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from portfolio_api.content.export import export_content, project_bodies
from portfolio_api.content.loader import Content, load_content
from portfolio_api.content.seed import seed
from portfolio_api.core.config import REPO_ROOT
from portfolio_api.db import models as m

CONTENT = REPO_ROOT / "content"


def _file(name: str) -> object:
    data = json.loads((CONTENT / "data" / f"{name}.json").read_text(encoding="utf-8"))
    data.pop("$schema", None)
    return data


@pytest.fixture(scope="module")
def content() -> Content:
    return load_content(CONTENT)


async def test_round_trip_matches_content_files(db: AsyncSession, content: Content) -> None:
    await seed(db, content)
    exported = await export_content(db)
    for name, data in exported.items():
        assert data == _file(name), f"{name}.json changed on the way through the database"
    bodies = await project_bodies(db)
    for p in content.projects:
        assert bodies[p["slug"]] == (CONTENT / p["body"]).read_text(encoding="utf-8")


async def test_seed_is_idempotent(db: AsyncSession, content: Content) -> None:
    first = await seed(db, content)
    once = await export_content(db)
    second = await seed(db, content)
    assert first == second
    assert await export_content(db) == once
    links = await db.scalar(select(func.count()).select_from(m.ProjectSkill))
    assert links == sum(len(set(p["skills"])) for p in content.projects)


async def test_seed_removes_rows_no_longer_in_content(db: AsyncSession, content: Content) -> None:
    await seed(db, content)
    smaller = copy.deepcopy(content)
    dropped = smaller.projects.pop()
    await seed(db, smaller)
    assert await db.get(m.Project, dropped["slug"]) is None
    slugs = (await db.scalars(select(m.Project.slug))).all()
    assert len(slugs) == len(content.projects) - 1


async def test_unknown_skill_reference_is_refused(db: AsyncSession, content: Content) -> None:
    broken = copy.deepcopy(content)
    broken.projects[0]["skills"].append("no-such-skill")
    with pytest.raises(IntegrityError, match="project_skill"):
        await seed(db, broken)


async def test_invalid_category_is_refused(db: AsyncSession, content: Content) -> None:
    broken = copy.deepcopy(content)
    broken.skills[0]["category"] = "astrology"
    with pytest.raises(IntegrityError, match="ck_skill_category"):
        await seed(db, broken)


def test_migrations_downgrade_and_upgrade_cleanly(alembic_cfg: Config) -> None:
    # Ends at head again, so tests that run after this one still have the schema.
    command.downgrade(alembic_cfg, "base")
    command.upgrade(alembic_cfg, "head")


def test_loader_strips_schema_hint(content: Content) -> None:
    assert "$schema" not in content.profile
    assert set(content.bodies) == {p["slug"] for p in content.projects}
