import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Project } from '../../core/content/content.types.gen';

export type WorkFilter = Project['filters'][number];

/** Chip labels for the filter values in content (public wording only). */
export const WORK_FILTERS: readonly { key: WorkFilter; label: string }[] = [
  { key: 'cad', label: 'CAD & 3D' },
  { key: 'documents', label: 'Documents' },
  { key: 'knowledge-base', label: 'Knowledge base' },
  { key: 'realtime', label: 'Real-time' },
  { key: 'ai', label: 'AI' },
  { key: 'personal', label: 'Personal' },
];

/** Featured first, then professional before personal; otherwise content order. */
export function sortProjects(projects: readonly Project[]): Project[] {
  const rank = (p: Project) => (p.featured ? 0 : 2) + (p.type === 'professional' ? 0 : 1);
  return projects
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map(({ p }) => p);
}

/** "All · CAD & 3D · …" toggle chips with counts. */
@Component({
  selector: 'app-work-filters',
  template: `
    <ul class="chips" role="list" aria-label="Filter projects">
      <li>
        <button type="button" [attr.aria-pressed]="active() === null" (click)="pick(null)">
          All <span class="n">{{ projects().length }}</span>
        </button>
      </li>
      @for (f of chips(); track f.key) {
        <li>
          <button type="button" [attr.aria-pressed]="active() === f.key" (click)="pick(f.key)">
            {{ f.label }} <span class="n">{{ f.count }}</span>
          </button>
        </li>
      }
    </ul>
  `,
  styles: `
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 24px;
      padding: 0;
      list-style: none;
    }
    button {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      padding: 7px 14px;
      border: 1px solid var(--line-2);
      border-radius: 999px;
      background: none;
      color: var(--ink-2);
      font: 500 13px var(--font-body, inherit);
      cursor: pointer;
    }
    button:hover {
      color: var(--ink);
    }
    button[aria-pressed='true'] {
      border-color: var(--violet);
      background: color-mix(in oklab, var(--violet) 16%, transparent);
      color: var(--ink);
    }
    .n {
      font: 11px var(--font-mono);
      color: var(--ink-2); /* ink-3 fails AA on the tinted active chip */
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkFilters {
  readonly projects = input.required<readonly Project[]>();
  readonly active = input<WorkFilter | null>(null);
  readonly activeChange = output<WorkFilter | null>();

  /** Only filters that have projects. */
  protected readonly chips = computed(() =>
    WORK_FILTERS.map((f) => ({
      ...f,
      count: this.projects().filter((p) => p.filters.includes(f.key)).length,
    })).filter((f) => f.count > 0),
  );

  protected pick(key: WorkFilter | null): void {
    this.activeChange.emit(key);
  }
}
