import { GraphNode, KnowledgeGraph } from '../../core/content/build-graph';

// Small force-directed layout (port of the prototype's stepKG): nodes repel,
// links pull like springs, everything drifts gently to the centre.
// Pure and deterministic given the random source; no Angular, no DOM.

export interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Time (ms) the node starts popping in; 0 = visible immediately. */
  born: number;
  /** Random offset so every node drifts on its own rhythm. */
  phase: number;
}

export interface SimLink {
  source: SimNode;
  target: SimNode;
}

export interface Sim {
  nodes: SimNode[];
  links: SimLink[];
  byId: Map<string, SimNode>;
  /** "Temperature": forces shrink as it cools (min 0.06), drags warm it up. */
  alpha: number;
  width: number;
  height: number;
}

const EDGE_MARGIN = 16;
/** Ambient drift force: small enough that the springs keep clusters intact. */
const DRIFT = 0.05;

export function createSim(
  graph: KnowledgeGraph,
  width: number,
  height: number,
  random: () => number,
  popInStart?: number,
): Sim {
  const count = graph.nodes.length;
  const nodes: SimNode[] = graph.nodes.map((n, i) => {
    // Start on a loose ring so the layout unfolds outward.
    const angle = (i / count) * Math.PI * 2;
    const spread = random() * 0.5 + 0.5;
    return {
      ...n,
      x: width / 2 + Math.cos(angle) * width * 0.3 * spread,
      y: height / 2 + Math.sin(angle) * height * 0.3 * spread,
      vx: 0,
      vy: 0,
      phase: random() * Math.PI * 2,
      // Hubs appear first, then the rest one by one.
      born: popInStart === undefined ? 0 : popInStart + (n.kind === 'hub' ? 0 : 120 + i * 28),
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links = graph.links.flatMap((l) => {
    const source = byId.get(l.source);
    const target = byId.get(l.target);
    return source && target ? [{ source, target }] : [];
  });
  return { nodes, links, byId, alpha: 1, width, height };
}

/** Keeps nodes in the same relative place when the canvas is resized. */
export function resizeSim(sim: Sim, width: number, height: number): void {
  if (!sim.width || !sim.height) return;
  const sx = width / sim.width;
  const sy = height / sim.height;
  for (const n of sim.nodes) {
    n.x *= sx;
    n.y *= sy;
  }
  sim.width = width;
  sim.height = height;
  sim.alpha = Math.max(sim.alpha, 0.3);
}

/**
 * One physics tick.
 * @param time performance.now() in ms. When given, nodes also drift gently forever
 *   (a slow wave per node), so the graph never freezes. Omit it for reduced motion.
 */
export function stepSim(sim: Sim, dragged: SimNode | null = null, time?: number): void {
  const { nodes, links, width: w, height: h, alpha: a } = sim;

  // Repulsion between nearby pairs (skip far ones: cheap and looks the same).
  for (let i = 0; i < nodes.length; i++) {
    const A = nodes[i];
    if (!A) continue; // (index is always valid; satisfies noUncheckedIndexedAccess)
    for (let j = i + 1; j < nodes.length; j++) {
      const B = nodes[j];
      if (!B) continue;
      let dx = B.x - A.x;
      let dy = B.y - A.y;
      const d2 = dx * dx + dy * dy + 0.01;
      if (d2 > 90000) continue;
      const f = (1400 / d2) * a;
      const d = Math.sqrt(d2);
      dx /= d;
      dy /= d;
      A.vx -= dx * f;
      A.vy -= dy * f;
      B.vx += dx * f;
      B.vy += dy * f;
    }
  }

  // Springs: links to hubs are longer, so categories form clusters.
  for (const { source: s, target: t } of links) {
    let dx = t.x - s.x;
    let dy = t.y - s.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const rest = s.kind === 'hub' || t.kind === 'hub' ? Math.min(w, h) * 0.17 : 60;
    const f = (d - rest) * 0.012 * a;
    dx /= d;
    dy /= d;
    s.vx += dx * f;
    s.vy += dy * f;
    t.vx -= dx * f;
    t.vy -= dy * f;
  }

  // Gravity to the centre, ambient drift, friction, move, keep inside the canvas.
  for (const n of nodes) {
    if (n === dragged) continue;
    if (time !== undefined) {
      n.vx += Math.sin(time * 0.0006 + n.phase) * DRIFT;
      n.vy += Math.cos(time * 0.0005 + n.phase * 1.3) * DRIFT;
    }
    n.vx = (n.vx + (w / 2 - n.x) * 0.0015 * a) * 0.86;
    n.vy = (n.vy + (h / 2 - n.y) * 0.0018 * a) * 0.86;
    n.x = clamp(n.x + n.vx, EDGE_MARGIN, w - EDGE_MARGIN);
    n.y = clamp(n.y + n.vy, EDGE_MARGIN, h - EDGE_MARGIN);
  }
  sim.alpha = Math.max(0.06, sim.alpha * 0.995);
}

/** Runs the simulation instantly (reduced motion: show the final layout, no settling). */
export function settle(sim: Sim, steps = 400): void {
  for (let i = 0; i < steps; i++) stepSim(sim);
}

/** Closest node under a point, with a generous hit area for small nodes. */
export function nodeAt(sim: Sim, x: number, y: number): SimNode | null {
  let best: SimNode | null = null;
  let bestD = Infinity;
  for (const n of sim.nodes) {
    const d = (n.x - x) ** 2 + (n.y - y) ** 2;
    const hit = Math.max(n.size + 8, 14) ** 2;
    if (d < hit && d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

/** The node itself plus everything directly linked to it. */
export function neighbourhood(sim: Sim, node: SimNode): Set<SimNode> {
  const set = new Set<SimNode>([node]);
  for (const l of sim.links) {
    if (l.source === node) set.add(l.target);
    if (l.target === node) set.add(l.source);
  }
  return set;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
