import { GraphNode, NodeCategory } from '../../core/content/build-graph';
import { categoryOf } from './graph-categories';

export interface TrailSummary {
  count: number;
  /** e.g. "CAD & visualization" */
  area: string;
  /** How many of the explored nodes are in that area. */
  inArea: number;
  /** A follow-up question for the agent. */
  question: string;
}

/** Nodes needed before the trail has something to say. */
export const TRAIL_MIN = 3;

// One follow-up per area, worded so the agent (scripted today, RAG later) can answer it.
export const TRAIL_QUESTIONS: Partial<Record<NodeCategory, string>> = {
  frontend: 'How do you architect complex tables, grids and forms?',
  cad: 'What did you build with Three.js, WebGL and DXF?',
  documents: 'How do you render large PDF documents?',
  realtime: 'How do you use SSE for real-time streams?',
  performance: 'How does your R-tree spatial index speed up hit-testing?',
  backend: 'What are you learning in Python backend: FastAPI and Django?',
  ai: 'What are you learning in AI: LLMs, RAG and agents?',
  fundamentals: 'What are your strongest skills?',
  leadership: 'Where did you lead or set technical direction?',
  project: 'Which project are you proudest of?',
  org: 'Where do you work, and what did you build there?',
};

/**
 * "You explored 7 nodes, mostly CAD & visualization": what the visitor's
 * hovering and clicking says about their interests. Hubs and topics don't count.
 */
export function summarizeTrail(
  nodes: readonly GraphNode[],
  visited: readonly string[],
): TrailSummary | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = visited
    .map((id) => byId.get(id))
    .filter((n): n is GraphNode => !!n && n.kind !== 'hub' && n.kind !== 'topic');
  if (seen.length < TRAIL_MIN) return null;

  const counts = new Map<NodeCategory, number>();
  for (const n of seen) counts.set(n.category, (counts.get(n.category) ?? 0) + 1);
  // Highest count wins; ties go to the area explored first.
  let best = seen[0]?.category ?? 'project';
  for (const n of seen) {
    if ((counts.get(n.category) ?? 0) > (counts.get(best) ?? 0)) best = n.category;
  }
  return {
    count: seen.length,
    area: categoryOf(best).label,
    inArea: counts.get(best) ?? 0,
    question: TRAIL_QUESTIONS[best] ?? 'Which project are you proudest of?',
  };
}
