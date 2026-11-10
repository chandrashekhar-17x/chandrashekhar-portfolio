"""Tests for scripts/check_confidential.py (names are never written in plain text)."""

from pathlib import Path

from check_confidential import find_leaks, main

# A real forbidden name, rebuilt from character codes so it isn't stored as text.
NAME = "".join(
    chr(c)
    for c in (
        69,
        83,
        80,
    )
)


def test_detects_a_forbidden_name_any_case() -> None:
    assert find_leaks(f"line one\nthe {NAME} module") == ["L2"]
    assert find_leaks(f"see {NAME.lower()}-to-x notes") == ["L1"]


def test_allows_ordinary_text_and_longer_words() -> None:
    assert find_leaks("Fundamentals: Data Structures, C++. Railway signalling plans.") == []
    assert find_leaks(f"{NAME}s and xx{NAME}") == []  # different words, different hashes


def test_hashes_only_no_plain_names_in_checker() -> None:
    with open("scripts/check_confidential.py", encoding="utf-8") as f:
        assert NAME.lower() not in f.read().lower()


def test_ignores_letters_inside_random_tokens() -> None:
    # e.g. base64 integrity hashes in lockfiles
    assert find_leaks(f"sha512-ab0{NAME}62xY") == []


def test_scans_folders_recursively(tmp_path: Path) -> None:
    # Regression: a folder argument used to be skipped, so the check passed vacuously.
    (tmp_path / "sub").mkdir()
    (tmp_path / "sub" / "page.md").write_text(f"About the {NAME} project")
    assert main([str(tmp_path)]) == 1
    (tmp_path / "sub" / "page.md").write_text("About the CAD project")
    assert main([str(tmp_path)]) == 0
