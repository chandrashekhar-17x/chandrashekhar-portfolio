"""Tests for scripts/validate_content.py.

Each test copies the real content/ folder to a temp dir, breaks one thing,
and checks the validator reports it.
"""

import json
import shutil
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest

from validate_content import main, validate

REAL_CONTENT = Path(__file__).resolve().parents[2] / "content"


@pytest.fixture
def content(tmp_path: Path) -> Path:
    root = tmp_path / "content"
    shutil.copytree(REAL_CONTENT, root)
    return root


def edit(root: Path, name: str, change: Callable[[dict[str, Any]], None]) -> None:
    path = root / "data" / f"{name}.json"
    data = json.loads(path.read_text())
    change(data)
    path.write_text(json.dumps(data))


def test_real_content_is_valid() -> None:
    errors, _ = validate(REAL_CONTENT)
    assert errors == []


def test_main_exit_codes(content: Path) -> None:
    assert main(["--root", str(content)]) == 0
    edit(content, "skills", lambda d: d["skills"].append(d["skills"][0]))
    assert main(["--root", str(content)]) == 1


def test_schema_violation_is_reported(content: Path) -> None:
    edit(content, "skills", lambda d: d["skills"][0].update(level=9))
    errors, _ = validate(content)
    assert any("skills.json" in e and "level" in e for e in errors)


def test_unknown_skill_reference(content: Path) -> None:
    edit(content, "projects", lambda d: d["projects"][0]["skills"].append("cobol"))
    errors, _ = validate(content)
    assert any("unknown skill 'cobol'" in e for e in errors)


def test_unknown_graph_node(content: Path) -> None:
    edge = {"src": "skill:angular", "dst": "topic:nope", "rel": "RELATED"}
    edit(content, "graph", lambda d: d["edges"].append(edge))
    errors, _ = validate(content)
    assert errors == ["graph edge: unknown node 'topic:nope'"]


def test_missing_case_study_file(content: Path) -> None:
    (content / "projects" / "custom-cad-editor.md").unlink()
    errors, _ = validate(content)
    assert any("missing file content/projects/custom-cad-editor.md" in e for e in errors)


def test_missing_data_file(content: Path) -> None:
    (content / "data" / "graph.json").unlink()
    errors, _ = validate(content)
    assert errors == ["missing data file: data/graph.json"]


def test_placeholders_are_listed(content: Path) -> None:
    _, placeholders = validate(content)
    assert "profile.photo" in placeholders  # real photo not provided yet
    edit(content, "projects", lambda d: d["projects"][0].update(placeholder=True))
    _, placeholders = validate(content)
    assert "project 'custom-cad-editor'" in placeholders


def test_professional_projects_cannot_have_links(content: Path) -> None:
    def add_link(d: dict[str, Any]) -> None:
        d["projects"][0]["links"] = {"repo": "https://github.com/x/y"}

    edit(content, "projects", add_link)
    errors, _ = validate(content)
    assert any("professional projects must not have links" in e for e in errors)


def test_highlight_must_link_a_real_project(content: Path) -> None:
    edit(
        content,
        "experience",
        lambda d: d["roles"][0]["highlights"].append({"text": "x", "project": "nope"}),
    )
    errors, _ = validate(content)
    assert any("unknown project 'nope'" in e for e in errors)


def test_skill_needs_proficiency_or_concept(content: Path) -> None:
    edit(content, "skills", lambda d: d["skills"][0].pop("proficiency"))
    errors, _ = validate(content)
    assert any("needs exactly one of proficiency or concept" in e for e in errors)


def test_stat_needs_value_or_computed(content: Path) -> None:
    edit(content, "profile", lambda d: d["stats"][1].pop("value"))
    errors, _ = validate(content)
    assert any("needs exactly one of value or computed" in e for e in errors)
