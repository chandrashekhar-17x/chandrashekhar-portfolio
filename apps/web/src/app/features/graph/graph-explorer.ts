import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { GraphNode, KnowledgeGraph, NodeCategory } from '../../core/content/build-graph';
import { GraphFilters } from './graph-filters';
import { GraphHighlightService } from './graph-highlight.service';
import { GraphList } from './graph-list';
import { GraphCanvas } from './graph-canvas';

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

  protected readonly filter = signal<NodeCategory | null>(null);
  protected readonly showList = signal(false);
  protected readonly highlights = inject(GraphHighlightService);
  protected readonly stats = computed(
    () => `${String(this.graph().nodes.length)} nodes · ${String(this.graph().links.length)} links`,
  );

  /** Clicking a node lights it and its direct neighbours. PR 6 also asks the agent. */
  protected onActivate(node: GraphNode): void {
    const ids = new Set([node.id]);
    for (const l of this.graph().links) {
      if (l.source === node.id) ids.add(l.target);
      if (l.target === node.id) ids.add(l.source);
    }
    this.highlights.highlight(ids);
  }
}
