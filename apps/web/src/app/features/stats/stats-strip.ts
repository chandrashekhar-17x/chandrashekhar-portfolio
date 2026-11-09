import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Profile } from '../../core/content/content.types.gen';
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
  /** Graph size is computed, not typed into content, so it is always true. */
  readonly skillCount = input.required<number>();

  protected readonly items = computed(() => [
    ...(this.profile().stats ?? []),
    { label: 'Skills in the knowledge graph', value: String(this.skillCount()) },
  ]);
}
