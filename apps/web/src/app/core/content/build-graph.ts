import { Experience, KnowledgeGraphExtras, Project, Skill } from './content.types.gen';

// Builds the knowledge graph from content (rules: content/README.md → Knowledge graph).
// Pure function: no Angular, easy to test. Moves to the API in Phase 2.

export type NodeKind = 'hub' | 'skill' | 'project' | 'org' | 'role' | 'topic';
export type NodeCategory = Skill['category'] | 'project' | 'org' | 'topic';
export type LinkRel = 'USED' | 'BUILT_AT' | 'WORKED_AT' | 'RELATED' | 'IN_CATEGORY';

export interface GraphNode {
  id: string; // e.g. "skill:angular"
  kind: NodeKind;
  label: string;
  category: NodeCategory;
  /** Visual weight: hubs biggest, then orgs/projects, then skills. */
  size: number;
  learning: boolean;
}

export interface GraphLink {
  source: string;
  target: string;
  rel: LinkRel;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphInput {
  skills: Skill[];
  experience: Experience;
  projects: Project[];
  extras: KnowledgeGraphExtras;
}

const HUB_LABELS: Record<Skill['category'], string> = {
  frontend: 'FRONTEND',
  backend: 'BACKEND',
  ai: 'AI ENGINEERING',
  graphics: 'GRAPHICS & DOCS',
  tools: 'TOOLS',
};

export function buildGraph({ skills, experience, projects, extras }: GraphInput): KnowledgeGraph {
  const nodes = new Map<string, GraphNode>();
  const links = new Map<string, GraphLink>();

  const addNode = (node: GraphNode) => nodes.set(node.id, node);
  const addLink = (source: string, target: string, rel: LinkRel) => {
    if (source === target) return;
    // One link per unordered pair, so duplicates from different rules don't stack.
    const key = [source, target].sort().join('|');
    if (!links.has(key)) links.set(key, { source, target, rel });
  };

  // Category hubs: only for categories that actually have skills.
  for (const category of new Set(skills.map((s) => s.category))) {
    addNode(hub(category));
  }
  for (const s of skills) {
    const id = `skill:${s.id}`;
    addNode({
      id,
      kind: 'skill',
      label: s.name,
      category: s.category,
      size: 6,
      learning: !!s.learning,
    });
    addLink(`hub:${s.category}`, id, 'IN_CATEGORY');
  }
  for (const o of experience.organizations) {
    addNode({
      id: `org:${o.id}`,
      kind: 'org',
      label: o.name,
      category: 'org',
      size: 8,
      learning: false,
    });
  }
  for (const r of experience.roles) {
    const id = `role:${r.id}`;
    addNode({ id, kind: 'role', label: r.title, category: 'org', size: 6, learning: false });
    addLink(id, `org:${r.org}`, 'WORKED_AT');
    r.skills.forEach((s) => {
      addLink(id, `skill:${s}`, 'USED');
    });
  }
  for (const p of projects) {
    const id = `project:${p.slug}`;
    addNode({ id, kind: 'project', label: p.title, category: 'project', size: 8, learning: false });
    p.skills.forEach((s) => {
      addLink(id, `skill:${s}`, 'USED');
    });
    if (p.org) addLink(id, `org:${p.org}`, 'BUILT_AT');
  }
  for (const t of extras.topics) {
    addNode({
      id: `topic:${t.id}`,
      kind: 'topic',
      label: t.label,
      category: 'topic',
      size: 9,
      learning: false,
    });
  }
  for (const e of extras.edges) {
    addLink(e.src, e.dst, e.rel === 'LEARNING' ? 'RELATED' : e.rel);
  }

  // Drop links whose ends don't exist (content validation should prevent this).
  const validLinks = [...links.values()].filter((l) => nodes.has(l.source) && nodes.has(l.target));
  return { nodes: [...nodes.values()], links: validLinks };
}

function hub(category: Skill['category']): GraphNode {
  return {
    id: `hub:${category}`,
    kind: 'hub',
    label: HUB_LABELS[category],
    category,
    size: 13,
    learning: false,
  };
}
