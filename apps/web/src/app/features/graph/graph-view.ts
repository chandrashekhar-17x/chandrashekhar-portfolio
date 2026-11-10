import { GraphLink, KnowledgeGraph, NodeCategory } from '../../core/content/build-graph';

// Small-screen views of the knowledge graph (73 nodes don't fit in ~380 px).
// Pure functions: the explorer picks one and hands it to the same canvas.

/**
 * Overview: only the category hubs, bigger. Two hubs are linked when one project
 * uses skills from both, so the overview still shows how areas connect.
 */
export function hubOverview(graph: KnowledgeGraph): KnowledgeGraph {
  const hubs = graph.nodes.filter((n) => n.kind === 'hub');
  const category = new Map(graph.nodes.map((n) => [n.id, n.category]));
  // project id → the skill categories it touches
  const touched = new Map<string, Set<NodeCategory>>();
  for (const l of graph.links) {
    for (const [p, s] of [
      [l.source, l.target],
      [l.target, l.source],
    ] as const) {
      if (!p.startsWith('project:') || !s.startsWith('skill:')) continue;
      const set = touched.get(p) ?? new Set<NodeCategory>();
      const c = category.get(s);
      if (c) set.add(c);
      touched.set(p, set);
    }
  }
  const links = new Map<string, GraphLink>();
  for (const cats of touched.values()) {
    const list = [...cats].sort();
    list.forEach((a, i) => {
      for (const b of list.slice(i + 1)) {
        links.set(`${a}|${b}`, { source: `hub:${a}`, target: `hub:${b}`, rel: 'RELATED' });
      }
    });
  }
  // A hub no project reaches (e.g. Fundamentals) links to the busiest hub,
  // so it doesn't float off on its own.
  const degree = new Map<string, number>();
  for (const l of links.values()) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }
  const busiest = [...degree.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  for (const h of hubs) {
    if (!degree.has(h.id) && busiest && busiest !== h.id) {
      links.set(`${h.id}|alone`, { source: h.id, target: busiest, rel: 'RELATED' });
    }
  }
  const ids = new Set(hubs.map((h) => h.id));
  return {
    nodes: hubs.map((h) => ({ ...h, size: 16 })),
    links: [...links.values()].filter((l) => ids.has(l.source) && ids.has(l.target)),
  };
}

/** One cluster: its hub, its skills, and the projects / employers / education linked to them. */
export function clusterView(graph: KnowledgeGraph, category: NodeCategory): KnowledgeGraph {
  const core = new Set(graph.nodes.filter((n) => n.category === category).map((n) => n.id));
  const keep = new Set(core);
  for (const l of graph.links) {
    if (core.has(l.source)) keep.add(l.target);
    if (core.has(l.target)) keep.add(l.source);
  }
  // Other categories' hubs would only pull the layout apart.
  const nodes = graph.nodes.filter(
    (n) => keep.has(n.id) && (n.kind !== 'hub' || n.category === category),
  );
  const ids = new Set(nodes.map((n) => n.id));
  return { nodes, links: graph.links.filter((l) => ids.has(l.source) && ids.has(l.target)) };
}
