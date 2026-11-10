import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';
import { Reveal } from '../../shared/ui/reveal/reveal';
import { Scramble } from '../../shared/ui/scramble.directive';
import { EducationCard } from './education-card';
import { ExperienceTimeline } from './experience-timeline';

/** Home section 04: experience timeline (lazy chunk). */
@Component({
  selector: 'app-experience-section',
  imports: [Reveal, Scramble, ExperienceTimeline, EducationCard],
  template: `
    <app-reveal kind="xp" label="experience" [count]="experience()?.roles?.length ?? 3">
      <ng-template>
        <div class="section-head reveal-item" style="--i: 0">
          <div>
            <p class="section-index">05 / experience</p>
            <h2 appScramble>The path so far.</h2>
          </div>
          <p>Grouped by company, newest first. Durations are computed from the dates.</p>
        </div>
        <div class="layout">
          @if (experience(); as xp) {
            <app-experience-timeline [experience]="xp" />
          }
          @if (education(); as edu) {
            <app-education-card class="reveal-item" style="--i: 3" [education]="edu" />
          }
        </div>
      </ng-template>
    </app-reveal>
  `,
  styles: `
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 40px;
      align-items: start;
    }

    @container site (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceSection {
  private readonly repo = inject(ContentRepository);
  protected readonly experience = toSignal(this.repo.experience());
  protected readonly education = toSignal(this.repo.education());
}
