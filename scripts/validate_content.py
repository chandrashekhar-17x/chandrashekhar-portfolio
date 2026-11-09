"""Validate content/ before it is committed or seeded into the database.

Checks, in order:
1. Each data/*.json file matches its JSON Schema (content/schemas/).
2. Every reference points at something real (skills, orgs, graph nodes, files).
3. Lists the placeholders (dummy data) that still need replacing (warning only).

Usage:  uv run python scripts/validate_content.py [--root content]
Exit code 1 if any error is found.
"""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource

DATA_FILES = ("profile", "skills", "experience", "projects", "graph")
Json = dict[str, Any]


def load_json(path: Path) -> Json:
    data: Json = json.loads(path.read_text(encoding="utf-8"))
    return data


def build_registry(schema_dir: Path) -> Registry[Any]:
    # Lets "common.schema.json#/$defs/..." refs resolve without network access.
    resources = [
        (schema["$id"], Resource.from_contents(schema))
        for schema in map(load_json, sorted(schema_dir.glob("*.schema.json")))
    ]
    return Registry().with_resources(resources)


def schema_errors(root: Path, data: dict[str, Json]) -> list[str]:
    registry = build_registry(root / "schemas")
    errors: list[str] = []
    for name, doc in data.items():
        schema = load_json(root / "schemas" / f"{name}.schema.json")
        validator = Draft202012Validator(schema, registry=registry, format_checker=FormatChecker())
        for err in validator.iter_errors(doc):
            location = "/".join(str(p) for p in err.absolute_path) or "(root)"
            errors.append(f"{name}.json → {location}: {err.message}")
    return errors


def duplicates(kind: str, ids: list[str]) -> list[str]:
    return [f"duplicate {kind} id '{i}'" for i, n in Counter(ids).items() if n > 1]


def reference_errors(root: Path, data: dict[str, Json]) -> list[str]:
    skills = [s["id"] for s in data["skills"]["skills"]]
    orgs = [o["id"] for o in data["experience"]["organizations"]]
    roles = data["experience"]["roles"]
    projects = data["projects"]["projects"]
    topics = [t["id"] for t in data["graph"]["topics"]]

    errors = [
        *duplicates("skill", skills),
        *duplicates("org", orgs),
        *duplicates("role", [r["id"] for r in roles]),
        *duplicates("project", [p["slug"] for p in projects]),
        *duplicates("topic", topics),
    ]
    skill_set, org_set = set(skills), set(orgs)

    for item, label in [(r, f"role '{r['id']}'") for r in roles] + [
        (p, f"project '{p['slug']}'") for p in projects
    ]:
        errors += [f"{label}: unknown skill '{s}'" for s in item["skills"] if s not in skill_set]
        if "org" in item and item["org"] not in org_set:
            errors.append(f"{label}: unknown org '{item['org']}'")

    for p in projects:
        if not (root / p["body"]).is_file():
            errors.append(f"project '{p['slug']}': missing file content/{p['body']}")

    photo = data["profile"]["photo"]["src"]
    if photo.startswith("/media/") and not (root / photo.lstrip("/")).is_file():
        errors.append(f"profile.photo: missing file content{photo}")

    nodes = (
        {f"skill:{i}" for i in skills}
        | {f"org:{i}" for i in orgs}
        | {f"role:{r['id']}" for r in roles}
        | {f"project:{p['slug']}" for p in projects}
        | {f"topic:{i}" for i in topics}
    )
    for edge in data["graph"]["edges"]:
        errors += [
            f"graph edge: unknown node '{edge[e]}'" for e in ("src", "dst") if edge[e] not in nodes
        ]
    return errors


def find_placeholders(data: dict[str, Json]) -> list[str]:
    found = [f"profile.{f}" for f in data["profile"].get("placeholderFields", [])]
    found += [
        f"profile.stats '{s['label']}'"
        for s in data["profile"].get("stats", [])
        if s.get("placeholder")
    ]
    groups = [
        ("skill", "id", data["skills"]["skills"]),
        ("org", "id", data["experience"]["organizations"]),
        ("role", "id", data["experience"]["roles"]),
        ("project", "slug", data["projects"]["projects"]),
    ]
    for kind, key, items in groups:
        found += [f"{kind} '{i[key]}'" for i in items if i.get("placeholder")]
    return found


def validate(root: Path) -> tuple[list[str], list[str]]:
    """Return (errors, placeholders) for the content folder at `root`."""
    missing = [n for n in DATA_FILES if not (root / "data" / f"{n}.json").is_file()]
    if missing:
        return [f"missing data file: data/{n}.json" for n in missing], []

    data = {n: load_json(root / "data" / f"{n}.json") for n in DATA_FILES}
    errors = schema_errors(root, data)
    if errors:  # reference checks assume the shape is valid
        return errors, []
    return reference_errors(root, data), find_placeholders(data)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--root", type=Path, default=Path("content"))
    args = parser.parse_args(argv)

    errors, placeholders = validate(args.root)
    for e in errors:
        print(f"✗ {e}")
    if placeholders:
        print(f"⚠ {len(placeholders)} placeholder(s) to replace before launch:")
        for p in placeholders:
            print(f"  · {p}")
    print("✓ content is valid" if not errors else f"✗ {len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
