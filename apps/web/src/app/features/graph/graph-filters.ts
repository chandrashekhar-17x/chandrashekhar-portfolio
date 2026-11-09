import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { KnowledgeGraph, NodeCategory } from '../../core/content/build-graph';
import { CATEGORIES } from './graph-categories';

/** Category toggles with node counts (prototype .kg-filters). Click again to clear. */
@Component({
  selector: 'app-graph-filters',
  template: `
    <ul class="filters" role="list" aria-label="Filter by category">
      @for (c of rows(); track c.key) {
        <li>
          <button type="button" [attr.aria-pressed]="active() === c.key" (click)="pick(c.key)">
            <span><i [style.background]="'var(' + c.color + ')'"></i>{{ c.label }}</span>
            <span class="count">{{ c.count }}</span>
          </button>
        </li>
      }
    </ul>
  `,
  styleUrl: './graph-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphFilters {
  readonly graph = input.required<KnowledgeGraph>();
  readonly active = input<NodeCategory | null>(null);
  readonly activeChange = output<NodeCategory | null>();

  /** Only categories that have nodes; hubs aren't counted. */
  protected readonly rows = computed(() =>
    CATEGORIES.map((c) => ({
      ...c,
      count: this.graph().nodes.filter((n) => n.category === c.key && n.kind !== 'hub').length,
    })).filter((c) => c.count > 0),
  );

  protected pick(key: NodeCategory): void {
    this.activeChange.emit(this.active() === key ? null : key);
  }
}
