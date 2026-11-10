import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Experience, Profile } from '../../core/content/content.types.gen';
import { experienceYears } from '../../core/time/duration';
import { CountUp } from '../../shared/ui/count-up.directive';

/** Row of headline numbers under the hero (prototype .stats). */
@Component({
  selector: 'app-stats-strip',
  imports: [CountUp],
  template: `
    <dl class="stats">
      @for (s of items(); track s.label) {
        <div>
          <dt>{{ s.label }}</dt>
          <dd [appCountUp]="s.value">{{ s.value }}</dd>
        </div>
      }
    </dl>
  `,
  styleUrl: './stats-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsStrip {
  readonly profile = input.required<Profile>();
  /** Roles, so "years of experience" is computed from dates and never goes stale. */
  readonly roles = input.required<Experience['roles']>();

  protected readonly items = computed(() =>
    (this.profile().stats ?? []).map((s) => ({
      label: s.label,
      // "3+ yrs" → "3+": the label already says "years".
      value: s.computed ? experienceYears(this.roles()).replace(/\s*yrs?$/, '') : (s.value ?? ''),
    })),
  );
}
