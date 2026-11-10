import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { ProjectGrid } from './project-grid';
import { WorkFilter, WorkFilters, sortProjects } from './work-filters';

/** /work: every project, featured first, with filter chips. Server-rendered (crawlable). */
@Component({
  selector: 'app-work-page',
  imports: [PageHeader, ProjectGrid, WorkFilters],
  template: `
    <app-page-header
      eyebrow="Selected work"
      title="Things I've built."
      lead="Employer projects appear under public titles with details anonymised; personal ones are open source."
    />
    <app-work-filters [projects]="all()" [active]="filter()" (activeChange)="filter.set($event)" />
    <p class="sr-only" role="status">{{ shown().length }} projects shown</p>
    <app-project-grid [projects]="shown()" [skills]="skills()" />
  `,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkPage {
  private readonly repo = inject(ContentRepository);
  protected readonly all = toSignal(this.repo.projects(), { initialValue: [] });
  protected readonly skills = toSignal(this.repo.skills(), { initialValue: [] });
  protected readonly filter = signal<WorkFilter | null>(null);

  protected readonly shown = computed(() => {
    const f = this.filter();
    const sorted = sortProjects(this.all());
    return f ? sorted.filter((p) => p.filters.includes(f)) : sorted;
  });
}
