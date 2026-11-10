"""Fail if confidential internal project names appear anywhere public.

The repo is public, so the forbidden names are NOT written here: only SHA-256
hashes of them (lower-case). We hash every word and every two-word phrase of
each scanned file and compare. Plural/longer words (e.g. "fundamentals") hash
differently and are allowed.

Scans: every git-tracked or new (not ignored) text file (except lockfiles) + the built public site
(apps/web/dist/web/browser) if present.
Usage:  uv run python scripts/check_confidential.py [paths...]
"""

from __future__ import annotations

import hashlib
import itertools
import re
import subprocess
import sys
from collections.abc import Iterable, Iterator
from pathlib import Path

FORBIDDEN_SHA256 = frozenset(
    {
        "f54344a0d2ec50a9cbdf6f91af95f9d69d729e839de4f24164952b7d59d4d7ba",  # 1 word(s)
        "c215cc7ced6a185b5bec9a81592cee80079f0ff267e4664ee8ac8713a5f3142e",  # 1 word(s)
        "d6c0324fb4ca223cfc7737ff0a1e7d3af47336617ec169403f40cff7f1289d7f",  # 1 word(s)
        "6c126e81fa8dc29d641331d844dfd9e9a7b592007531f71c0a70186e3a46d1d1",  # 1 word(s)
        "e55e8d14e595fa2b30e0a6072d29cc895fe24588016071a1da24a0382b1479b1",  # 2 word(s)
    }
)

TEXT_SUFFIXES = {
    ".ts",
    ".html",
    ".scss",
    ".css",
    ".js",
    ".mjs",
    ".cjs",
    ".json",
    ".md",
    ".py",
    ".yml",
    ".yaml",
    ".toml",
    ".txt",
    ".xml",
    ".svg",
    ".cfg",
    ".ini",
}
# A word must stand alone: letters not glued to other letters/digits, so random
# base64 (integrity hashes) can't match. Hyphens still separate words.
WORD = re.compile(r"(?<![A-Za-z0-9])[A-Za-z]+(?![A-Za-z0-9])")
# Generated third-party files: not our content.
SKIP_NAMES = {"pnpm-lock.yaml", "uv.lock"}


def _hash(term: str) -> str:
    return hashlib.sha256(term.lower().encode()).hexdigest()


def find_leaks(text: str) -> list[str]:
    """Return the line numbers ("L12") where a forbidden word or phrase occurs."""
    hits: list[str] = []
    for n, line in enumerate(text.splitlines(), 1):
        words = WORD.findall(line)
        candidates = words + [f"{a} {b}" for a, b in itertools.pairwise(words)]
        if any(_hash(c) in FORBIDDEN_SHA256 for c in candidates):
            hits.append(f"L{n}")
    return hits


def tracked_files(root: Path) -> Iterator[Path]:
    out = subprocess.run(
        # tracked + new (not ignored) files, so leaks are caught before they are committed
        ["git", "ls-files", "--cached", "--others", "--exclude-standard"],  # noqa: S607
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    )
    for name in out.stdout.splitlines():
        yield root / name


def scan(paths: Iterable[Path]) -> dict[str, list[str]]:
    leaks: dict[str, list[str]] = {}
    for path in paths:
        if path.suffix not in TEXT_SUFFIXES or path.name in SKIP_NAMES or not path.is_file():
            continue
        hits = find_leaks(path.read_text(encoding="utf-8", errors="ignore"))
        if hits:
            leaks[str(path)] = hits
    return leaks


def main(argv: list[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    root = Path(__file__).resolve().parents[1]
    if args:
        # Folders are scanned recursively (a folder argument used to be skipped silently).
        paths: list[Path] = []
        for a in map(Path, args):
            paths.extend(a.rglob("*") if a.is_dir() else [a])
    else:
        # The public surface of the build is what browsers download (not the server
        # bundle, which contains third-party data such as MIME-type lists).
        public = root / "apps/web/dist/web/browser"
        paths = [*tracked_files(root), *(public.rglob("*") if public.exists() else [])]
    leaks = scan(paths)
    for file, lines in leaks.items():
        print(f"✗ confidential name in {file} ({', '.join(lines[:10])})")
    print("✓ no confidential names found" if not leaks else f"✗ {len(leaks)} file(s) leak names")
    return 1 if leaks else 0


if __name__ == "__main__":
    sys.exit(main())
