import { GraphNode, NodeCategory } from '../../core/content/build-graph';

/** Legend entry: label + the CSS colour token used for the node (docs/Design.md). */
export interface CategoryMeta {
  key: NodeCategory;
  label: string;
  color: `--${string}`;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { key: 'frontend', label: 'Frontend', color: '--cyan' },
  { key: 'cad', label: 'CAD & visualization', color: '--amber' },
  { key: 'documents', label: 'Document processing', color: '--teal' },
  { key: 'realtime', label: 'API & real-time', color: '--orange' },
  { key: 'performance', label: 'Performance', color: '--rose' },
  { key: 'backend', label: 'Backend (growing)', color: '--lime' },
  { key: 'ai', label: 'AI (growing)', color: '--pink' },
  { key: 'fundamentals', label: 'Fundamentals', color: '--ink-2' },
  { key: 'leadership', label: 'Leadership & R&D', color: '--ink' },
  { key: 'project', label: 'Projects', color: '--violet' },
  { key: 'org', label: 'Employment & education', color: '--blue' },
  { key: 'topic', label: 'Topics', color: '--ink-3' },
];

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryOf(key: NodeCategory): CategoryMeta {
  return BY_KEY.get(key) ?? { key, label: key, color: '--ink-2' };
}

const KIND_LABEL: Record<GraphNode['kind'], string> = {
  hub: 'Category',
  skill: 'Skill',
  concept: 'Concept',
  project: 'Project',
  org: 'Employer',
  education: 'Education',
  topic: 'Topic',
};

/** "Frontend · Skill (growing)" style description for tooltips and the list view. */
export function describeNode(n: GraphNode): string {
  const growing = n.learning ? ' (growing)' : '';
  return `${categoryOf(n.category).label} · ${KIND_LABEL[n.kind]}${growing}`;
}
