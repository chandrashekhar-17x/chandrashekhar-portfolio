"""Knowledge graph built from content: a Python port of the web's `buildGraph`
(apps/web/src/app/core/content/build-graph.ts, rules in content/README.md).

Both versions are checked against one shared expected output
(apps/api/tests/fixtures/graph.expected.json), so they can't drift apart.
Node and link order matter (the canvas layout is seeded by order), so this
keeps the same insertion order as the TypeScript Maps.
"""

from typing import Any

Doc = dict[str, Any]

HUB_LABELS = {
    "frontend": "FRONTEND",
    "cad": "CAD & VISUALIZATION",
    "documents": "DOCUMENT PROCESSING",
    "realtime": "API & REAL-TIME",
    "performance": "PERFORMANCE",
    "backend": "BACKEND (GROWING)",
    "ai": "AI (GROWING)",
    "fundamentals": "FUNDAMENTALS",
    "leadership": "LEADERSHIP & R&D",
}


def build_graph(
    *,
    skills: list[Doc],
    organizations: list[Doc],
    roles: list[Doc],
    education: list[Doc],
    projects: list[Doc],
    extras: Doc,
) -> Doc:
    nodes: dict[str, Doc] = {}
    links: dict[tuple[str, ...], Doc] = {}

    def node(
        id_: str, kind: str, label: str, category: str, size: int, *, learning: bool = False
    ) -> None:
        nodes[id_] = {
            "id": id_,
            "kind": kind,
            "label": label,
            "category": category,
            "size": size,
            "learning": learning,
        }

    def link(source: str, target: str, rel: str) -> None:
        if source == target:
            return
        # One link per unordered pair, so duplicates from different rules don't stack.
        key = tuple(sorted((source, target)))
        links.setdefault(key, {"source": source, "target": target, "rel": rel})

    # Category hubs: only for categories that actually have skills (first-seen order).
    for category in dict.fromkeys(s["category"] for s in skills):
        node(f"hub:{category}", "hub", HUB_LABELS[category], category, 13)
    for s in skills:
        sid = f"skill:{s['id']}"
        concept = bool(s.get("concept"))
        node(
            sid,
            "concept" if concept else "skill",
            s["name"],
            s["category"],
            5 if concept else 6,
            learning=s.get("proficiency") == "learning",
        )
        link(f"hub:{s['category']}", sid, "IN_CATEGORY")

    # Organisations link straight to the skills used in their roles.
    for o in organizations:
        node(f"org:{o['id']}", "org", o["name"], "org", 8)
    for r in roles:
        for s in r["skills"]:
            link(f"org:{r['org']}", f"skill:{s}", "USED")
    for e in education:
        eid = f"edu:{e['id']}"
        node(eid, "education", e["shortName"], "org", 8)
        for s in e.get("skills", []):
            link(eid, f"skill:{s}", "STUDIED")

    for p in projects:
        pid = f"project:{p['slug']}"
        node(pid, "project", p["title"], "project", 8)
        for s in p["skills"]:
            link(pid, f"skill:{s}", "USED")
        if p.get("org"):
            link(pid, f"org:{p['org']}", "BUILT_AT")
    for t in extras["topics"]:
        node(f"topic:{t['id']}", "topic", t["label"], "topic", 9)
    for e in extras["edges"]:
        link(e["src"], e["dst"], e["rel"])

    # Drop links whose ends don't exist (content validation should prevent this).
    valid = [lk for lk in links.values() if lk["source"] in nodes and lk["target"] in nodes]
    return {"nodes": list(nodes.values()), "links": valid}
