import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';
import { Reveal } from '../../shared/ui/reveal/reveal';
import { Scramble } from '../../shared/ui/scramble.directive';
import { ExperienceTimeline } from './experience-timeline';

/** Home section 04: experience timeline (lazy chunk). */
@Component({
  selector: 'app-experience-section',
  imports: [Reveal, Scramble, ExperienceTimeline],
  template: `
    <app-reveal kind="xp" label="experience" [count]="experience()?.roles?.length ?? 3">
      <ng-template>
        <div class="section-head reveal-item" style="--i: 0">
          <div>
            <p class="section-index">04 / experience</p>
            <h2 appScramble>The path so far.</h2>
          </div>
          <p>
            Roles, newest first. Entries marked "sample" are placeholders until real data lands.
          </p>
        </div>
        @if (experience(); as xp) {
          <app-experience-timeline [experience]="xp" />
        }
      </ng-template>
    </app-reveal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceSection {
  protected readonly experience = toSignal(inject(ContentRepository).experience());
}
