"""Read the content tables back into the `content/data/*.json` shapes.

Used by the round-trip test today (content → DB → these dicts == the files),
by the public read API next (PR 3) and by `make content-export` in Phase 3.
"""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from portfolio_api.content.loader import Doc
from portfolio_api.db import models as m


async def _docs(session: AsyncSession, doc: InstrumentedAttribute[Any], order: Any) -> list[Doc]:
    return list((await session.scalars(select(doc).order_by(order))).all())


async def export_content(session: AsyncSession) -> dict[str, Doc]:
    """Data file name (without `.json`) → its object, exactly as in `content/data/`."""
    profile = await session.scalar(select(m.Profile.doc))
    steps = await session.scalars(select(m.AboutStep.text).order_by(m.AboutStep.position))
    return {
        "profile": profile or {},
        "skills": {"skills": await _docs(session, m.Skill.doc, m.Skill.position)},
        "experience": {
            "organizations": await _docs(session, m.Organization.doc, m.Organization.position),
            "roles": await _docs(session, m.Role.doc, m.Role.position),
        },
        "education": {"education": await _docs(session, m.Education.doc, m.Education.position)},
        "projects": {"projects": await _docs(session, m.Project.doc, m.Project.position)},
        "about": {
            "areas": await _docs(session, m.AboutArea.doc, m.AboutArea.position),
            "howIWork": list(steps.all()),
        },
        "lab": {"timeline": await _docs(session, m.LabEntry.doc, m.LabEntry.position)},
        "graph": {
            "topics": await _docs(session, m.GraphTopic.doc, m.GraphTopic.position),
            "edges": await _docs(session, m.GraphEdge.doc, m.GraphEdge.position),
        },
    }


async def project_bodies(session: AsyncSession) -> dict[str, str]:
    """Case-study markdown by slug."""
    rows = await session.execute(select(m.Project.slug, m.Project.body_markdown))
    return {slug: body for slug, body in rows.all()}
