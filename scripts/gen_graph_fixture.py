"""Write the expected knowledge graph for content/ to apps/api/tests/fixtures/.

Both graph builders (web TypeScript, API Python) are tested against this one
file, so they can't drift apart. Re-run after changing content: `make graph-fixture`.
"""

import json

from portfolio_api.content.loader import load_content
from portfolio_api.core.config import REPO_ROOT
from portfolio_api.services.graph import build_graph

OUT = REPO_ROOT / "apps/api/tests/fixtures/graph.expected.json"


def expected_graph() -> dict[str, object]:
    c = load_content(REPO_ROOT / "content")
    return build_graph(
        skills=c.skills,
        organizations=c.organizations,
        roles=c.roles,
        education=c.education,
        projects=c.projects,
        extras=c.graph,
    )


if __name__ == "__main__":
    OUT.write_text(json.dumps(expected_graph(), indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {OUT.relative_to(REPO_ROOT)}")
