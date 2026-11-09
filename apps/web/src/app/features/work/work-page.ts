import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { ProjectGrid } from './project-grid';

/** /work: every project as cards, fully server-rendered (crawlable, no skeletons). */
@Component({
  selector: 'app-work-page',
  imports: [PageHeader, ProjectGrid],
  template: `
    <app-page-header
      eyebrow="Selected work"
      title="Things I've built."
      lead="Editors, renderers, data-heavy UIs, and the AI systems I'm building now."
    />
    <app-project-grid [projects]="projects()" [skills]="skills()" />
  `,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkPage {
  private readonly repo = inject(ContentRepository);
  protected readonly projects = toSignal(this.repo.projects(), { initialValue: [] });
  protected readonly skills = toSignal(this.repo.skills(), { initialValue: [] });
}
