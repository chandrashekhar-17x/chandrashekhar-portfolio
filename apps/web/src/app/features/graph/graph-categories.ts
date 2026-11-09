import { GraphNode, NodeCategory } from '../../core/content/build-graph';

/** Legend entry: label + the CSS colour token used for the node (docs/Design.md). */
export interface CategoryMeta {
  key: NodeCategory;
  label: string;
  color: `--${string}`;
}

export const CATEGORIES: readonly CategoryMeta[] = [
  { key: 'frontend', label: 'Frontend', color: '--cyan' },
  { key: 'ai', label: 'AI engineering', color: '--pink' },
  { key: 'backend', label: 'Backend', color: '--lime' },
  { key: 'graphics', label: 'Graphics & docs', color: '--amber' },
  { key: 'tools', label: 'Tools', color: '--ink-2' },
  { key: 'project', label: 'Projects', color: '--violet' },
  { key: 'org', label: 'Employments', color: '--blue' },
  { key: 'topic', label: 'Topics', color: '--ink' },
];

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryOf(key: NodeCategory): CategoryMeta {
  return BY_KEY.get(key) ?? { key, label: key, color: '--ink-2' };
}

const KIND_LABEL: Record<GraphNode['kind'], string> = {
  hub: 'Category',
  skill: 'Skill',
  project: 'Project',
  org: 'Organisation',
  role: 'Role',
  topic: 'Topic',
};

/** "Frontend · Skill (learning)" style description for tooltips and the list view. */
export function describeNode(n: GraphNode): string {
  const learning = n.learning ? ' (learning)' : '';
  return `${categoryOf(n.category).label} · ${KIND_LABEL[n.kind]}${learning}`;
}
