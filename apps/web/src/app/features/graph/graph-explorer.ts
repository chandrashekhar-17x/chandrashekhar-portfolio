import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { GraphNode, KnowledgeGraph } from '../../core/content/build-graph';
import { GraphFilters } from './graph-filters';
import { ChatStore } from '../../core/chat/chat-store.service';
import { GraphHighlightService } from '../../core/graph/graph-highlight.service';
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

  protected readonly showList = signal(false);
  protected readonly highlights = inject(GraphHighlightService);
  protected readonly filter = this.highlights.filter;
  protected readonly stats = computed(
    () => `${String(this.graph().nodes.length)} nodes · ${String(this.graph().links.length)} links`,
  );

  private readonly chat = inject(ChatStore);

  /** Clicking a node lights it and its neighbours; skills/projects also ask the agent. */
  protected onActivate(node: GraphNode): void {
    if (node.kind !== 'hub') this.chat.ask(`Tell me about ${node.label}`);
    const ids = new Set([node.id]);
    for (const l of this.graph().links) {
      if (l.source === node.id) ids.add(l.target);
      if (l.target === node.id) ids.add(l.source);
    }
    this.highlights.highlight(ids);
  }
}
