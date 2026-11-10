import {
  Education,
  Experience,
  KnowledgeGraphExtras,
  Project,
  Skill,
  SkillCategory,
} from './content.types.gen';

// Builds the knowledge graph from content (rules: content/README.md → Knowledge graph).
// Pure function: no Angular, easy to test. Moves to the API in Phase 2.

export type NodeKind = 'hub' | 'skill' | 'concept' | 'project' | 'org' | 'education' | 'topic';
export type NodeCategory = SkillCategory | 'project' | 'org' | 'topic';
export type LinkRel =
  | 'USED'
  | 'BUILT_AT'
  | 'WORKED_AT'
  | 'STUDIED'
  | 'RELATED'
  | 'IN_CATEGORY'
  | 'BUILT_ON'
  | 'DEMONSTRATES';

export interface GraphNode {
  id: string; // e.g. "skill:angular", "project:custom-cad-editor", "edu:nit-jamshedpur"
  kind: NodeKind;
  label: string;
  category: NodeCategory;
  /** Visual weight: hubs biggest, then orgs/projects, then skills/concepts. */
  size: number;
  /** "Growing" skill (proficiency: learning): drawn with a dashed ring. */
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
  education: Education['education'];
  projects: Project[];
  extras: KnowledgeGraphExtras;
}

export const HUB_LABELS: Record<SkillCategory, string> = {
  frontend: 'FRONTEND',
  cad: 'CAD & VISUALIZATION',
  documents: 'DOCUMENT PROCESSING',
  realtime: 'API & REAL-TIME',
  performance: 'PERFORMANCE',
  backend: 'BACKEND (GROWING)',
  ai: 'AI (GROWING)',
  fundamentals: 'FUNDAMENTALS',
  leadership: 'LEADERSHIP & R&D',
};

export function buildGraph(input: GraphInput): KnowledgeGraph {
  const { skills, experience, education, projects, extras } = input;
  const nodes = new Map<string, GraphNode>();
  const links = new Map<string, GraphLink>();

  const addNode = (node: GraphNode) => nodes.set(node.id, node);
  const addLink = (source: string, target: string, rel: LinkRel) => {
    if (source === target) return;
    // One link per unordered pair, so duplicates from different rules don't stack.
    const key = [source, target].sort().join('|');
    if (!links.has(key)) links.set(key, { source, target, rel });
  };
  const node = (id: string, kind: NodeKind, label: string, category: NodeCategory, size: number) =>
    addNode({ id, kind, label, category, size, learning: false });

  // Category hubs: only for categories that actually have skills.
  for (const category of new Set(skills.map((s) => s.category))) {
    node(`hub:${category}`, 'hub', HUB_LABELS[category], category, 13);
  }
  for (const s of skills) {
    const id = `skill:${s.id}`;
    addNode({
      id,
      kind: s.concept ? 'concept' : 'skill',
      label: s.name,
      category: s.category,
      size: s.concept ? 5 : 6,
      learning: s.proficiency === 'learning',
    });
    addLink(`hub:${s.category}`, id, 'IN_CATEGORY');
  }

  // Organisations link straight to the skills used in their roles.
  for (const o of experience.organizations) node(`org:${o.id}`, 'org', o.name, 'org', 8);
  for (const r of experience.roles) {
    r.skills.forEach((s) => {
      addLink(`org:${r.org}`, `skill:${s}`, 'USED');
    });
  }
  for (const e of education) {
    const id = `edu:${e.id}`;
    node(id, 'education', e.shortName, 'org', 8);
    (e.skills ?? []).forEach((s) => {
      addLink(id, `skill:${s}`, 'STUDIED');
    });
  }

  for (const p of projects) {
    const id = `project:${p.slug}`;
    node(id, 'project', p.title, 'project', 8);
    p.skills.forEach((s) => {
      addLink(id, `skill:${s}`, 'USED');
    });
    if (p.org) addLink(id, `org:${p.org}`, 'BUILT_AT');
  }
  for (const t of extras.topics) node(`topic:${t.id}`, 'topic', t.label, 'topic', 9);
  for (const e of extras.edges) addLink(e.src, e.dst, e.rel);

  // Drop links whose ends don't exist (content validation should prevent this).
  const validLinks = [...links.values()].filter((l) => nodes.has(l.source) && nodes.has(l.target));
  return { nodes: [...nodes.values()], links: validLinks };
}
