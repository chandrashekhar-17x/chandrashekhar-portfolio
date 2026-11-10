import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';
import { EducationEntry } from '../../core/content/content.types.gen';

/** Education, shown beside the experience timeline (below it on narrow screens). */
@Component({
  selector: 'app-education-card',
  template: `
    <h3 class="label">Education</h3>
    <ul class="list" role="list">
      @for (e of education(); track e.id) {
        <li class="card">
          <span class="mono" aria-hidden="true">{{ e.monogram ?? e.shortName.charAt(0) }}</span>
          <div>
            <h4>{{ e.institute }}</h4>
            <p>{{ e.degree }} · {{ e.field }}</p>
            <p class="when">{{ e.start }} – {{ e.end }}</p>
            @if (e.skills?.length) {
              <ul class="chips" role="list" aria-label="Studied">
                @for (s of e.skills; track s) {
                  <li class="tag">{{ skillName()(s) }}</li>
                }
              </ul>
            }
          </div>
        </li>
      }
    </ul>
  `,
  styleUrl: './education-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationCard {
  readonly education = input.required<readonly EducationEntry[]>();
  private readonly skills = toSignal(inject(ContentRepository).skills(), { initialValue: [] });

  protected readonly skillName = computed(() => {
    const names = new Map(this.skills().map((s) => [s.id, s.name]));
    return (id: string) => names.get(id) ?? id;
  });
}
