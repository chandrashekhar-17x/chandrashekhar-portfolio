import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { GraphNode, KnowledgeGraph, NodeCategory } from '../../core/content/build-graph';
import { AnimationLoop } from '../../core/motion/animation-loop';
import { cssVar, fitCanvas, FittedCanvas } from '../../core/motion/canvas';
import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { seededRandom } from '../../core/motion/seeded-random';
import { ThemeService } from '../../core/theme/theme.service';
import { CATEGORIES, describeNode } from './graph-categories';
import { GraphHighlightService } from '../../core/graph/graph-highlight.service';
import { Palette, drawGraph } from './graph-renderer';
import {
  Sim,
  SimNode,
  createSim,
  neighbourhood,
  nodeAt,
  resizeSim,
  settle,
  stepSim,
} from './graph-sim';

/**
 * Interactive force graph on a canvas: hover to focus, drag nodes, click to
 * highlight. The canvas is decorative for assistive tech; the list view
 * (GraphList) carries the same information accessibly.
 */
@Component({
  selector: 'app-graph-canvas',
  templateUrl: './graph-canvas.html',
  styleUrl: './graph-canvas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-cursor]': 'hovered() ? "highlight" : "drag"' },
})
export class GraphCanvas {
  readonly graph = input.required<KnowledgeGraph>();
  readonly filter = input<NodeCategory | null>(null);
  /** A node was clicked (not dragged). */
  readonly activate = output<GraphNode>();

  protected readonly hovered = signal<SimNode | null>(null);
  protected readonly connections = computed(() => {
    const n = this.hovered();
    return n && this.sim ? [...neighbourhood(this.sim, n)].filter((x) => x !== n) : [];
  });
  protected readonly summary = computed(
    () =>
      `Knowledge graph with ${String(this.graph().nodes.length)} nodes and ${String(this.graph().links.length)} connections. Use "View as list" for an accessible version.`,
  );
  protected readonly describe = describeNode;

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly tip = viewChild.required<ElementRef<HTMLElement>>('tip');
  private readonly theme = inject(ThemeService);
  private readonly prefs = inject(MediaPrefs);
  private readonly highlights = inject(GraphHighlightService);
  private readonly destroyRef = inject(DestroyRef);

  private sim?: Sim;
  private fitted: FittedCanvas | null = null;
  private palette?: Palette;

  constructor() {
    afterNextRender(() => {
      this.start();
    });
    // Colours come from CSS tokens: re-read them when the theme changes (browser only:
    // the server has no computed styles, and the canvas never draws there anyway).
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    effect(() => {
      this.theme.theme();
      if (browser) this.palette = readPalette();
    });
    // A new filter shakes the layout a little, like the prototype.
    effect(() => {
      this.filter();
      untracked(() => {
        if (this.sim) this.sim.alpha = Math.max(this.sim.alpha, 0.5);
      });
    });
  }

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const animate = !this.prefs.reducedMotion();
    this.fitted = fitCanvas(canvas);
    const w = this.fitted?.width ?? 600;
    const h = this.fitted?.height ?? 420;
    const sim = createSim(
      this.graph(),
      w,
      h,
      seededRandom(42),
      animate ? performance.now() : undefined,
    );
    if (!animate) settle(sim); // reduced motion: final layout straight away
    this.sim = sim;
    this.palette ??= readPalette();

    let dragged: SimNode | null = null;
    let downAt = { x: 0, y: 0 };

    const frame = () => {
      if (!this.fitted || !this.palette) return;
      // Animated: physics + endless gentle drift. Reduced motion: still, except while dragging.
      if (animate) stepSim(sim, dragged, performance.now());
      else if (dragged) stepSim(sim, dragged);
      drawGraph(
        this.fitted.ctx,
        sim,
        {
          hovered: this.hovered(),
          filter: this.filter(),
          lit: this.highlights.ids(),
          now: performance.now(),
          animate,
        },
        this.palette,
      );
    };
    const loop = new AnimationLoop(canvas, frame);

    const local = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      return { x: e.clientX - box.left, y: e.clientY - box.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      if (dragged) {
        dragged.x = p.x;
        dragged.y = p.y;
        sim.alpha = Math.max(sim.alpha, 0.3);
        return;
      }
      const hit = nodeAt(sim, p.x, p.y);
      if (hit !== this.hovered()) this.hovered.set(hit); // change detection only on change
      this.moveTip(p.x, p.y);
      if (!animate) frame();
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      dragged = nodeAt(sim, p.x, p.y);
      downAt = p;
      if (dragged) canvas.setPointerCapture(e.pointerId);
    };
    const onUp = (e: PointerEvent) => {
      const p = local(e);
      const moved = Math.hypot(p.x - downAt.x, p.y - downAt.y) > 6;
      if (dragged && !moved) this.activate.emit(dragged);
      dragged = null;
    };
    const onLeave = () => {
      this.hovered.set(null);
      if (!animate) frame();
    };
    const resize = new ResizeObserver(() => {
      this.fitted = fitCanvas(canvas);
      if (this.fitted) resizeSim(sim, this.fitted.width, this.fitted.height);
      frame();
    });

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    resize.observe(canvas);
    frame();

    this.destroyRef.onDestroy(() => {
      loop.destroy();
      resize.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    });
  }

  /** Tooltip follows the pointer via direct style writes (no change detection). */
  private moveTip(x: number, y: number): void {
    const tip = this.tip().nativeElement;
    const w = this.fitted?.width ?? 0;
    const left = x + 260 > w ? x - 250 : x + 14;
    tip.style.transform = `translate(${String(left)}px, ${String(y + 14)}px)`;
  }
}

function readPalette(): Palette {
  const category = Object.fromEntries(CATEGORIES.map((c) => [c.key, cssVar(c.color)])) as Record<
    NodeCategory,
    string
  >;
  return { category, label: cssVar('--ink-2') };
}
