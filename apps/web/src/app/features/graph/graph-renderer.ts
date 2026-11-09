import { NodeCategory } from '../../core/content/build-graph';
import { Sim, SimNode, neighbourhood } from './graph-sim';

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
  if (s.filter && node.category !== s.filter && node.kind !== 'hub') return true;
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
  const t = s.now / 1000;

  // Links first, so nodes sit on top.
  for (const { source, target } of sim.links) {
    const grow = Math.min(growth(source, s.now, s.animate), growth(target, s.now, s.animate));
    if (!grow) continue;
    const dim = isDimmed(source, s, focus) || isDimmed(target, s, focus);
    ctx.globalAlpha = (dim ? 0.06 : focus ? 0.8 : 0.32) * grow;
    ctx.strokeStyle = palette.category[source.category];
    ctx.lineWidth = focus && !dim ? 1.4 : 0.8;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  }

  for (const n of sim.nodes) {
    const grow = growth(n, s.now, s.animate);
    if (!grow) continue;
    const dim = isDimmed(n, s, focus);
    const lit = s.lit.has(n.id);
    const color = palette.category[n.category];
    const pulse = lit ? 1.4 + (s.animate ? Math.sin(t * 6) * 0.15 : 0) : 1;
    const r = grow * n.size * pulse * (n === s.hovered ? 1.3 : 1);

    // Soft halo
    const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3);
    halo.addColorStop(0, color);
    halo.addColorStop(1, 'transparent');
    ctx.globalAlpha = dim ? 0.05 : lit ? 0.7 : 0.35;
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r * 3, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.globalAlpha = dim ? 0.25 : 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fill();

    if (showsLabel(n, s, focus, lit)) {
      ctx.globalAlpha = dim ? 0.2 : 1;
      ctx.fillStyle = n.kind === 'hub' ? color : palette.label;
      ctx.font = n.kind === 'hub' ? LABEL_FONT_HUB : LABEL_FONT;
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y - r - 7);
    }
  }
  ctx.globalAlpha = 1;
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
