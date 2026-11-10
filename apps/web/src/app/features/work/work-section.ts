import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ContentRepository } from '../../core/content/content-repository';
import { Reveal } from '../../shared/ui/reveal/reveal';
import { ProjectGrid } from './project-grid';

/** Home section 02: featured projects, cards revealed one by one (lazy chunk). */
@Component({
  selector: 'app-work-section',
  imports: [Reveal, ProjectGrid, RouterLink],
  template: `
    <app-reveal kind="work" label="selected work" [count]="featured().length || 3">
      <ng-template>
        <div class="section-head reveal-item" style="--i: 0">
          <div>
            <p class="section-index">03 / selected work</p>
            <h2>Things I've built.</h2>
          </div>
          <p>
            Real frontend engineering (editors, renderers, data-heavy UIs) and the AI systems I'm
            building now.
          </p>
        </div>
        <app-project-grid
          class="reveal-item"
          style="--i: 1"
          [projects]="featured()"
          [skills]="skills()"
          [staggered]="true"
        />
        <p class="all reveal-item" style="--i: 2">
          <a routerLink="/work">All {{ count() }} projects, with filters →</a>
        </p>
      </ng-template>
    </app-reveal>
  `,
  styles: `
    .all {
      margin-top: 22px;
      text-align: right;

      a {
        color: var(--cyan);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkSection {
  private readonly repo = inject(ContentRepository);
  private readonly projects = toSignal(this.repo.projects(), { initialValue: [] });
  protected readonly skills = toSignal(this.repo.skills(), { initialValue: [] });
  protected readonly featured = computed(() => this.projects().filter((p) => p.featured));
  protected readonly count = computed(() => this.projects().length);
}
