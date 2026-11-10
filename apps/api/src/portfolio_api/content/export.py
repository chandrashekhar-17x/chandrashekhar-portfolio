"""Read the content tables back in the `content/data/*.json` shapes.

One function per resource; the public read API (api/routes/content.py) serves
them, the round-trip test checks them against the files, and Phase 3's
`make content-export` will write them back to `content/`.
"""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from portfolio_api.content.loader import Doc
from portfolio_api.db import models as m
from portfolio_api.services.graph import build_graph


async def _docs(session: AsyncSession, doc: InstrumentedAttribute[Any], order: Any) -> list[Doc]:
    return list((await session.scalars(select(doc).order_by(order))).all())


async def read_profile(session: AsyncSession) -> Doc | None:
    return await session.scalar(select(m.Profile.doc))


async def read_skills(session: AsyncSession) -> list[Doc]:
    return await _docs(session, m.Skill.doc, m.Skill.position)


async def read_experience(session: AsyncSession) -> Doc:
    return {
        "organizations": await _docs(session, m.Organization.doc, m.Organization.position),
        "roles": await _docs(session, m.Role.doc, m.Role.position),
    }


async def read_education(session: AsyncSession) -> list[Doc]:
    return await _docs(session, m.Education.doc, m.Education.position)


async def read_projects(session: AsyncSession, *, featured: bool | None = None) -> list[Doc]:
    query = select(m.Project.doc).order_by(m.Project.position)
    if featured is not None:
        query = query.where(m.Project.featured.is_(featured))
    return list((await session.scalars(query)).all())


async def read_project(session: AsyncSession, slug: str) -> Doc | None:
    """One project plus its case study as `bodyMarkdown` (the API's ProjectDetail)."""
    row = (
        await session.execute(
            select(m.Project.doc, m.Project.body_markdown).where(m.Project.slug == slug)
        )
    ).first()
    return None if row is None else row[0] | {"bodyMarkdown": row[1]}


async def read_about(session: AsyncSession) -> Doc:
    steps = await session.scalars(select(m.AboutStep.text).order_by(m.AboutStep.position))
    return {
        "areas": await _docs(session, m.AboutArea.doc, m.AboutArea.position),
        "howIWork": list(steps.all()),
    }


async def read_lab(session: AsyncSession) -> Doc:
    return {"timeline": await _docs(session, m.LabEntry.doc, m.LabEntry.position)}


async def read_graph_extras(session: AsyncSession) -> Doc:
    return {
        "topics": await _docs(session, m.GraphTopic.doc, m.GraphTopic.position),
        "edges": await _docs(session, m.GraphEdge.doc, m.GraphEdge.position),
    }


async def read_graph(session: AsyncSession) -> Doc:
    """Nodes and links derived from the content tables (same rules as the web)."""
    experience = await read_experience(session)
    return build_graph(
        skills=await read_skills(session),
        organizations=experience["organizations"],
        roles=experience["roles"],
        education=await read_education(session),
        projects=await read_projects(session),
        extras=await read_graph_extras(session),
    )


async def export_content(session: AsyncSession) -> dict[str, Doc]:
    """Data file name (without `.json`) → its object, exactly as in `content/data/`."""
    return {
        "profile": await read_profile(session) or {},
        "skills": {"skills": await read_skills(session)},
        "experience": await read_experience(session),
        "education": {"education": await read_education(session)},
        "projects": {"projects": await read_projects(session)},
        "about": await read_about(session),
        "lab": await read_lab(session),
        "graph": await read_graph_extras(session),
    }


async def project_bodies(session: AsyncSession) -> dict[str, str]:
    """Case-study markdown by slug."""
    rows = await session.execute(select(m.Project.slug, m.Project.body_markdown))
    return {slug: body for slug, body in rows.all()}
