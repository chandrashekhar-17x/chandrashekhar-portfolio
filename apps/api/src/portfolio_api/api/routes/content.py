"""Public, read-only content API: what the website shows, as JSON.

Each response is cached in Redis (services/cache.py) and carries an ETag: a
fingerprint of the body. A browser that already has the data sends it back
in `If-None-Match`; when it still matches, the answer is an empty
304 Not Modified instead of the whole JSON again.
"""

import hashlib
from collections.abc import Awaitable, Callable
from typing import Annotated, Any

from fastapi import APIRouter, HTTPException, Path, Query, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from portfolio_api.api.deps import CacheDep, SessionDep
from portfolio_api.content import export as read

router = APIRouter(prefix="/api/v1", tags=["content"])

# Browsers/CDNs may reuse a response for 60 s, then revalidate with the ETag.
CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300"
Reader = Callable[[AsyncSession], Awaitable[Any]]


def _etag(body: bytes) -> str:
    return '"' + hashlib.sha256(body).hexdigest()[:32] + '"'


def _respond(request: Request, body: bytes) -> Response:
    etag = _etag(body)
    headers = {"ETag": etag, "Cache-Control": CACHE_CONTROL}
    sent = request.headers.get("if-none-match", "")
    if etag in {t.strip() for t in sent.split(",")} or sent.strip() == "*":
        return Response(status_code=304, headers=headers)
    return Response(body, media_type="application/json", headers=headers)


async def _serve(
    request: Request, cache: CacheDep, session: AsyncSession, key: str, reader: Reader
) -> Response:
    body = await cache.get_or_build(key, lambda: reader(session))
    if body is None:
        raise HTTPException(404, f"No {key} content yet")
    return _respond(request, body)


def _route(path: str, key: str, reader: Reader, summary: str) -> None:
    async def endpoint(request: Request, cache: CacheDep, session: SessionDep) -> Response:
        return await _serve(request, cache, session, key, reader)

    endpoint.__name__ = f"get_{key}"
    router.add_api_route(path, endpoint, methods=["GET"], summary=summary)


_route("/profile", "profile", read.read_profile, "Profile (name, bio, links, stats)")
_route("/skills", "skills", read.read_skills, "All skills, in display order")
_route("/experience", "experience", read.read_experience, "Organizations and roles")
_route("/education", "education", read.read_education, "Education entries")
_route("/about", "about", read.read_about, "Experience areas and How I work")
_route("/lab", "lab", read.read_lab, "Learning timeline")
_route("/graph", "graph", read.read_graph, "Knowledge graph: nodes and links")


@router.get("/projects", summary="Projects, optionally only featured ones")
async def get_projects(
    request: Request,
    cache: CacheDep,
    session: SessionDep,
    featured: Annotated[bool | None, Query()] = None,
) -> Response:
    key = "projects" if featured is None else f"projects:featured={str(featured).lower()}"
    body = await cache.get_or_build(key, lambda: read.read_projects(session, featured=featured))
    return _respond(request, body or b"[]")


@router.get("/projects/{slug}", summary="One project with its case study (bodyMarkdown)")
async def get_project(
    request: Request,
    cache: CacheDep,
    session: SessionDep,
    # Same pattern as content slugs; also keeps junk out of cache keys.
    slug: Annotated[str, Path(pattern=r"^[a-z0-9][a-z0-9-]{0,95}$")],
) -> Response:
    body = await cache.get_or_build(f"project:{slug}", lambda: read.read_project(session, slug))
    if body is None:
        raise HTTPException(404, "Project not found")
    return _respond(request, body)
