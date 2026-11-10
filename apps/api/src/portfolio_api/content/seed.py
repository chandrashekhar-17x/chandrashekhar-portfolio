"""Sync `content/` into the database: `make seed` (or `python -m portfolio_api.content.seed`).

Idempotent: rows are upserted by their stable ids (INSERT … ON CONFLICT DO
UPDATE), so running it twice leaves the same data. Rows whose id is no longer
in `content/` are deleted, so the database mirrors the files exactly. Everything
happens in one transaction: if any reference is broken, nothing changes.

Phase 3 (admin editing) makes the database the place where content is edited;
from then on this is a first-time seed and `make content-export` goes the other way.
"""

import asyncio
from dataclasses import dataclass
from typing import Any

from redis.exceptions import RedisError
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from portfolio_api.content.loader import Content, Doc, load_content
from portfolio_api.core.config import get_settings
from portfolio_api.db import models as m
from portfolio_api.db.redis import make_redis
from portfolio_api.db.session import make_engine, make_session_factory
from portfolio_api.services.cache import clear_content_cache


@dataclass(frozen=True)
class SeedReport:
    """How many rows each table holds after the seed (printed by the CLI)."""

    counts: dict[str, int]

    def __str__(self) -> str:
        return ", ".join(f"{name} {n}" for name, n in self.counts.items())


def _ordered(items: list[Doc], key: str = "id") -> list[dict[str, Any]]:
    """Common columns: stable id, list position and the whole object as `doc`."""
    return [{key: item[key], "position": i, "doc": item} for i, item in enumerate(items)]


async def _upsert(
    session: AsyncSession, model: type[m.Base], rows: list[dict[str, Any]], key: str
) -> None:
    """INSERT … ON CONFLICT (key) DO UPDATE: one statement for all rows."""
    if not rows:
        return
    stmt = insert(model).values(rows)
    updates = {c: stmt.excluded[c] for c in rows[0] if c != key}
    await session.execute(stmt.on_conflict_do_update(index_elements=[key], set_=updates))


async def _prune(
    session: AsyncSession, column: InstrumentedAttribute[str], keep: list[dict[str, Any]]
) -> None:
    """Delete rows whose id is no longer in content/."""
    await session.execute(delete(column.class_).where(column.not_in([r[column.key] for r in keep])))


async def _replace(session: AsyncSession, model: type[m.Base], rows: list[dict[str, Any]]) -> None:
    """Tables without stable ids (ordered lists, link tables): delete all, insert."""
    await session.execute(delete(model))
    if rows:
        await session.execute(insert(model).values(rows))


def _skill_links(items: list[Doc], id_field: str, column: str) -> list[dict[str, Any]]:
    # dict.fromkeys drops duplicate skills while keeping order.
    return [
        {column: item[id_field], "skill_id": s}
        for item in items
        for s in dict.fromkeys(item.get("skills", []))
    ]


async def seed(session: AsyncSession, content: Content) -> SeedReport:
    """Make the content tables match `content`. The caller commits."""
    c = content
    orgs = [
        r | {"name": o["name"]}
        for r, o in zip(_ordered(c.organizations), c.organizations, strict=True)
    ]
    skills = [
        r | {"name": s["name"], "category": s["category"], "proficiency": s.get("proficiency")}
        for r, s in zip(_ordered(c.skills), c.skills, strict=True)
    ]
    roles = [
        r | {"org_id": x["org"], "start": x["start"], "end": x.get("end")}
        for r, x in zip(_ordered(c.roles), c.roles, strict=True)
    ]
    education = _ordered(c.education)
    projects = [
        r
        | {"title": p["title"], "type": p["type"], "featured": p.get("featured", False)}
        | {"org_id": p.get("org"), "body_markdown": c.bodies[p["slug"]]}
        for r, p in zip(_ordered(c.projects, "slug"), c.projects, strict=True)
    ]
    areas = _ordered(c.about["areas"])
    topics = _ordered(c.graph["topics"])

    # 1. Remove what content/ no longer has: links first, then rows that point at
    #    organizations/skills, then organizations/skills themselves.
    for link in (m.ProjectSkill, m.RoleSkill, m.EducationSkill):
        await session.execute(delete(link))
    await _prune(session, m.Project.slug, projects)
    await _prune(session, m.Role.id, roles)
    await _prune(session, m.Education.id, education)
    await _prune(session, m.AboutArea.id, areas)
    await _prune(session, m.GraphTopic.id, topics)
    await _prune(session, m.Organization.id, orgs)
    await _prune(session, m.Skill.id, skills)

    # 2. Upsert parents before the rows that reference them.
    await _upsert(session, m.Organization, orgs, "id")
    await _upsert(session, m.Skill, skills, "id")
    await _upsert(session, m.Role, roles, "id")
    await _upsert(session, m.Education, education, "id")
    await _upsert(session, m.Project, projects, "slug")
    await _upsert(session, m.AboutArea, areas, "id")
    await _upsert(session, m.GraphTopic, topics, "id")
    await _upsert(session, m.Profile, [{"id": 1, "doc": c.profile}], "id")

    # 3. Link tables and ordered lists are rewritten whole.
    await _replace(session, m.ProjectSkill, _skill_links(c.projects, "slug", "project_slug"))
    await _replace(session, m.RoleSkill, _skill_links(c.roles, "id", "role_id"))
    await _replace(session, m.EducationSkill, _skill_links(c.education, "id", "education_id"))
    steps = [{"position": i, "text": t} for i, t in enumerate(c.about["howIWork"])]
    await _replace(session, m.AboutStep, steps)
    lab = [{"position": i, "topic": e["topic"], "doc": e} for i, e in enumerate(c.lab["timeline"])]
    await _replace(session, m.LabEntry, lab)
    edges = [
        {"position": i, "src": e["src"], "dst": e["dst"], "rel": e["rel"], "doc": e}
        for i, e in enumerate(c.graph["edges"])
    ]
    await _replace(session, m.GraphEdge, edges)

    await session.flush()
    return SeedReport(
        {
            "skills": len(skills),
            "organizations": len(orgs),
            "roles": len(roles),
            "education": len(education),
            "projects": len(projects),
            "about areas": len(areas),
            "lab entries": len(lab),
            "graph topics": len(topics),
            "graph edges": len(edges),
        }
    )


async def main() -> None:
    settings = get_settings()
    content = load_content(settings.content_dir)
    engine = make_engine(settings)
    try:
        async with make_session_factory(engine)() as session, session.begin():
            report = await seed(session, content)
    finally:
        await engine.dispose()
    print(f"Seeded from {settings.content_dir}: {report}")
    # New content should show up now, not after the cache expires.
    redis = make_redis(settings)
    try:
        print(f"Cleared {await clear_content_cache(redis)} cached API responses")
    except (RedisError, OSError):
        print("Redis not reachable: cached API responses expire on their own")
    finally:
        await redis.aclose()


if __name__ == "__main__":
    asyncio.run(main())
