import { NodeCategory } from '../../core/content/build-graph';
import { Sim, SimLink, SimNode, neighbourhood } from './graph-sim';

// Draws the graph (port of the prototype's drawKG). Pure: everything it needs
// comes in through arguments, so it is easy to test and reason about.

export interface Palette {
  /** Resolved colour per category (read from CSS tokens on theme change). */
  category: Record<NodeCategory, string>;
  label: string;
}

export interface RenderState {
  hovered: SimNode | null;
  filter: NodeCategory | null;
  /** Node ids cited by the agent / clicked: they glow and pulse. */
  lit: ReadonlySet<string>;
  /** performance.now() in ms. */
  now: number;
  /** false for reduced motion: no pop-in, no pulsing. */
  animate: boolean;
}

const LABEL_FONT_HUB = '700 11px "JetBrains Mono Variable", monospace';
const LABEL_FONT = '500 10.5px "JetBrains Mono Variable", monospace';

/** 0 → 1 ease-out "pop" as a node is born. */
export function growth(node: SimNode, now: number, animate: boolean): number {
  if (!animate || !node.born) return 1;
  const k = Math.max(0, Math.min(1, (now - node.born) / 550));
  return 1 - Math.pow(1 - k, 3);
}

/** Is a node faded out by hover focus, the category filter or a highlight? */
export function isDimmed(node: SimNode, s: RenderState, focus: Set<SimNode> | null): boolean {
  if (focus) return !focus.has(node);
  // Filter: only the chosen category stays bright (its own hub included, other hubs not).
  if (s.filter && node.category !== s.filter) return true;
  return s.lit.size > 0 && !s.lit.has(node.id);
}

export function drawGraph(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  s: RenderState,
  palette: Palette,
): void {
  ctx.clearRect(0, 0, sim.width, sim.height);
  const focus = s.hovered ? neighbourhood(sim, s.hovered) : null;
  drawLinks(ctx, sim, s, palette, focus);
  drawNodes(ctx, sim, s, palette, focus);
  if (s.hovered) drawEdgeLabels(ctx, sim, s.hovered, palette);
  ctx.globalAlpha = 1;
}

/**
 * Links are batched: one stroke per (colour, alpha, width) group instead of one per
 * link. Links still popping in are drawn individually (their alpha is changing).
 */
function drawLinks(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  s: RenderState,
  palette: Palette,
  focus: Set<SimNode> | null,
): void {
  const batches = new Map<string, { color: string; alpha: number; width: number; path: Path2D }>();
  for (const { source, target } of sim.links) {
    const grow = Math.min(growth(source, s.now, s.animate), growth(target, s.now, s.animate));
    if (!grow) continue;
    const dim = isDimmed(source, s, focus) || isDimmed(target, s, focus);
    const alpha = (dim ? 0.06 : focus ? 0.8 : 0.32) * grow;
    const color = palette.category[source.category];
    const width = focus && !dim ? 1.4 : 0.8;
    const key =
      grow === 1
        ? `${color}|${String(alpha)}|${String(width)}`
        : `${color}|${source.id}|${target.id}`;
    let batch = batches.get(key);
    if (!batch) {
      batch = { color, alpha, width, path: new Path2D() };
      batches.set(key, batch);
    }
    batch.path.moveTo(source.x, source.y);
    batch.path.lineTo(target.x, target.y);
  }
  for (const b of batches.values()) {
    ctx.globalAlpha = b.alpha;
    ctx.strokeStyle = b.color;
    ctx.lineWidth = b.width;
    ctx.stroke(b.path);
  }
}

function drawNodes(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  s: RenderState,
  palette: Palette,
  focus: Set<SimNode> | null,
): void {
  const t = s.now / 1000;
  for (const n of sim.nodes) {
    const grow = growth(n, s.now, s.animate);
    if (!grow) continue;
    const dim = isDimmed(n, s, focus);
    const lit = s.lit.has(n.id);
    const color = palette.category[n.category];
    const pulse = lit ? 1.4 + (s.animate ? Math.sin(t * 6) * 0.15 : 0) : 1;
    const r = grow * n.size * pulse * (n === s.hovered ? 1.3 : 1);

    // Soft halo: a pre-rendered sprite per colour (no gradient creation per frame).
    ctx.globalAlpha = dim ? 0.05 : lit ? 0.7 : 0.35;
    drawHalo(ctx, color, n.x, n.y, r * 3);

    // Core dot
    ctx.globalAlpha = dim ? 0.25 : 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fill();

    // "Growing" skills (proficiency: learning) get a dashed ring.
    if (n.learning) {
      ctx.globalAlpha = dim ? 0.2 : 0.9;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (showsLabel(n, s, focus, lit) || sim.nodes.length <= SMALL_VIEW) {
      ctx.globalAlpha = dim ? 0.2 : 1;
      ctx.fillStyle = n.kind === 'hub' ? color : palette.label;
      ctx.font = n.kind === 'hub' ? LABEL_FONT_HUB : LABEL_FONT;
      ctx.textAlign = 'center';
      const full = n === s.hovered || lit;
      const text = full ? n.label : shortLabel(n.label);
      // Narrow canvases: long hub names go on two lines so neighbours don't collide.
      const lines = n.kind === 'hub' && sim.width < 600 ? splitLabel(text) : [text];
      lines.forEach((line, i) => {
        ctx.fillText(line, n.x, n.y - r - 7 - (lines.length - 1 - i) * 13);
      });
    }
  }
}

/**
 * Canvas label for long titles: "Custom CAD Viewer & Editor, built from zero" →
 * "Custom CAD Viewer & Edi…". The tooltip and list view keep the full title.
 */
export function shortLabel(label: string, max = 22): string {
  const head = label.split(/[:,(]/)[0]?.trim() ?? label;
  return head.length > max ? `${head.slice(0, max - 1).trimEnd()}…` : head;
}

/** Views this small (phone drill-down) label every node: touch has no hover. */
const SMALL_VIEW = 24;

/** "DOCUMENT PROCESSING" → ["DOCUMENT", "PROCESSING"]; short names stay on one line. */
export function splitLabel(label: string, max = 12): string[] {
  if (label.length <= max) return [label];
  const words = label.split(' ');
  let best = [label];
  let bestWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const width = Math.max(a.length, b.length);
    if (width < bestWidth) {
      best = [a, b];
      bestWidth = width;
    }
  }
  return best;
}

/** Relations worth naming on hover (the rest are obvious from the layout). */
const EDGE_LABEL: Partial<Record<SimLink['rel'], string>> = {
  BUILT_ON: 'built on',
  DEMONSTRATES: 'demonstrates',
};

/** Text and position of the hovered node's "built on" / "demonstrates" link labels. */
export function edgeLabels(sim: Sim, hovered: SimNode): { text: string; x: number; y: number }[] {
  return sim.links.flatMap((l) => {
    const text = EDGE_LABEL[l.rel];
    if (!text || (l.source !== hovered && l.target !== hovered)) return [];
    return [{ text, x: (l.source.x + l.target.x) / 2, y: (l.source.y + l.target.y) / 2 - 4 }];
  });
}

function drawEdgeLabels(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  hovered: SimNode,
  palette: Palette,
): void {
  ctx.globalAlpha = 1;
  ctx.font = LABEL_FONT;
  ctx.textAlign = 'center';
  ctx.fillStyle = palette.label;
  for (const l of edgeLabels(sim, hovered)) ctx.fillText(l.text, l.x, l.y);
}

const SPRITE_SIZE = 64;
const haloSprites = new Map<string, HTMLCanvasElement | null>();

/** Radial glow drawn from a cached 64×64 sprite (falls back to a gradient if unavailable). */
function drawHalo(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  radius: number,
): void {
  let sprite = haloSprites.get(color);
  if (sprite === undefined) {
    sprite = makeHaloSprite(color);
    haloSprites.set(color, sprite);
  }
  if (sprite) {
    ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
    return;
  }
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function makeHaloSprite(color: string): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SPRITE_SIZE;
  const c = canvas.getContext('2d');
  if (!c) return null; // e.g. jsdom in unit tests
  const half = SPRITE_SIZE / 2;
  const g = c.createRadialGradient(half, half, 0, half, half, half);
  g.addColorStop(0, color);
  g.addColorStop(1, 'transparent');
  c.fillStyle = g;
  c.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return canvas;
}

/** Labels only where they help: hubs, projects, orgs, and whatever is in focus. */
function showsLabel(n: SimNode, s: RenderState, focus: Set<SimNode> | null, lit: boolean): boolean {
  return (
    n.kind === 'hub' ||
    n.kind === 'project' ||
    n.kind === 'org' ||
    n.kind === 'topic' ||
    lit ||
    (focus?.has(n) ?? false)
  );
}
