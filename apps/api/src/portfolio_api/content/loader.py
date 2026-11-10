"""Read the `content/` seed files into plain dicts (one object per data file).

Validation (schemas, references) is `scripts/validate_content.py`'s job and runs
before seeding; this module only reads. The database foreign keys are a second
safety net: a dangling reference makes the seed transaction fail as a whole.
"""

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

Doc = dict[str, Any]


@dataclass(frozen=True)
class Content:
    profile: Doc
    skills: list[Doc]
    organizations: list[Doc]
    roles: list[Doc]
    education: list[Doc]
    projects: list[Doc]
    about: Doc
    lab: Doc
    graph: Doc
    # Case-study markdown by project slug (from `project.body` paths).
    bodies: dict[str, str]


def _read(root: Path, name: str) -> Doc:
    data: Doc = json.loads((root / "data" / f"{name}.json").read_text(encoding="utf-8"))
    data.pop("$schema", None)  # editor hint only, not content
    return data


def load_content(root: Path) -> Content:
    experience = _read(root, "experience")
    projects: list[Doc] = _read(root, "projects")["projects"]
    return Content(
        profile=_read(root, "profile"),
        skills=_read(root, "skills")["skills"],
        organizations=experience["organizations"],
        roles=experience["roles"],
        education=_read(root, "education")["education"],
        projects=projects,
        about=_read(root, "about"),
        lab=_read(root, "lab"),
        graph=_read(root, "graph"),
        bodies={p["slug"]: (root / p["body"]).read_text(encoding="utf-8") for p in projects},
    )
