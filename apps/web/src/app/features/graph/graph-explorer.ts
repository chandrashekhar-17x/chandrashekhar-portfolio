import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { GraphNode, KnowledgeGraph } from '../../core/content/build-graph';
import { GraphFilters } from './graph-filters';
import { ChatStore } from '../../core/chat/chat-store.service';
import { GraphHighlightService } from '../../core/graph/graph-highlight.service';
import { GraphTrail } from '../../core/graph/graph-trail.service';
import { summarizeTrail } from './trail-summary';
import { GraphList } from './graph-list';
import { GraphCanvas } from './graph-canvas';
import { HUB_LABELS } from '../../core/content/build-graph';
import { clusterView, hubOverview } from './graph-view';

/** Side panel (intro, filters, list toggle) + canvas or list (prototype .kg). */
@Component({
  selector: 'app-graph-explorer',
  imports: [GraphFilters, GraphList, GraphCanvas],
  templateUrl: './graph-explorer.html',
  styleUrl: './graph-explorer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.tall]': 'tall()' },
})
export class GraphExplorer {
  readonly graph = input.required<KnowledgeGraph>();
  /** Full-screen variant for the /graph page. */
  readonly tall = input(false);

  protected readonly showList = signal(false);
  protected readonly highlights = inject(GraphHighlightService);
  protected readonly filter = this.highlights.filter;
  protected readonly stats = computed(
    () => `${String(this.graph().nodes.length)} nodes · ${String(this.graph().links.length)} links`,
  );

  private readonly chat = inject(ChatStore);
  protected readonly trail = inject(GraphTrail);
  /** "You explored 7 nodes, mostly CAD": shown once the visitor has explored a bit. */
  protected readonly trailSummary = computed(() =>
    summarizeTrail(this.graph().nodes, this.trail.visited()),
  );

  /**
   * Narrow screens (< 600 px) get a drill-down instead of the full network:
   * the hubs first, then one cluster at a time. Server render = desktop.
   */
  protected readonly narrow = signal(false);
  protected readonly view = computed(() => {
    const g = this.graph();
    if (!this.narrow()) return g;
    const f = this.filter();
    return f ? clusterView(g, f) : hubOverview(g);
  });
  /**
   * Key that remounts the canvas only when it must draw a different graph:
   * phone drill-down steps. On desktop a filter just dims nodes in place, so the
   * key never changes and the layout is never rebuilt.
   */
  protected readonly viewKey = computed(() => [
    this.narrow() ? `area:${this.filter() ?? 'all'}` : 'full',
  ]);
  protected readonly clusterTitle = computed(() => {
    const f = this.filter();
    return f && f in HUB_LABELS ? HUB_LABELS[f as keyof typeof HUB_LABELS] : (f ?? '');
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new ResizeObserver(([entry]) => {
        const narrow = (entry?.contentRect.width ?? 1000) < 600;
        if (narrow !== this.narrow()) this.narrow.set(narrow);
      });
      observer.observe(host);
      destroyRef.onDestroy(() => {
        observer.disconnect();
      });
    });
  }

  protected askTrail(question: string): void {
    this.chat.ask(question);
  }

  /** Clicking a node lights it and its neighbours; skills/projects also ask the agent. */
  protected onActivate(node: GraphNode): void {
    // Small screens: tapping a hub opens its cluster.
    if (this.narrow() && node.kind === 'hub' && !this.filter()) {
      this.filter.set(node.category);
      return;
    }
    this.trail.visit(node.id);
    if (node.kind !== 'hub') this.chat.ask(`Tell me about ${node.label}`);
    const ids = new Set([node.id]);
    for (const l of this.graph().links) {
      if (l.source === node.id) ids.add(l.target);
      if (l.target === node.id) ids.add(l.source);
    }
    this.highlights.highlight(ids);
  }
}
