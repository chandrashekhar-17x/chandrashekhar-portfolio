import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { GraphNode, KnowledgeGraph } from '../../core/content/build-graph';
import { CATEGORIES } from './graph-categories';

/**
 * Accessible alternative to the canvas: every node grouped by category,
 * with what it is connected to. Fully keyboard and screen-reader friendly.
 */
@Component({
  selector: 'app-graph-list',
  template: `
    @for (group of groups(); track group.key) {
      <section [attr.aria-labelledby]="'kg-' + group.key">
        <h3 [id]="'kg-' + group.key">{{ group.label }} ({{ group.nodes.length }})</h3>
        <ul role="list">
          @for (n of group.nodes; track n.node.id) {
            <li [class.lit]="lit().has(n.node.id)">
              <b>{{ n.node.label }}</b>
              @if (n.node.learning) {
                <span class="chip">learning</span>
              }
              @if (n.links.length) {
                <span class="muted"> — {{ n.links.join(', ') }}</span>
              }
            </li>
          }
        </ul>
      </section>
    }
  `,
  styleUrl: './graph-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphList {
  readonly graph = input.required<KnowledgeGraph>();
  readonly lit = input<ReadonlySet<string>>(new Set());

  protected readonly groups = computed(() => {
    const { nodes, links } = this.graph();
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const linked = (n: GraphNode) =>
      links
        .filter((l) => l.source === n.id || l.target === n.id)
        .map((l) => byId.get(l.source === n.id ? l.target : l.source))
        .filter((x): x is GraphNode => !!x && x.kind !== 'hub') // the group heading says it
        .map((x) => x.label);
    return CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      nodes: nodes
        .filter((n) => n.category === c.key && n.kind !== 'hub')
        .map((node) => ({ node, links: linked(node) })),
    })).filter((g) => g.nodes.length > 0);
  });
}
