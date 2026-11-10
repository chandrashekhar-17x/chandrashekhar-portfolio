import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Experience } from '../../core/content/content.types.gen';
import { byRecency, formatEmployment, formatPeriod } from './format-period';

/** Vertical timeline of roles, newest first (prototype .xp). */
@Component({
  selector: 'app-experience-timeline',
  imports: [RouterLink],
  template: `
    <ol class="xp">
      @for (r of roles(); track r.id; let i = $index) {
        <li class="item reveal-item" [style.--i]="i + 1">
          <p class="when">{{ r.period }}</p>
          <h3>
            @if (r.monogram) {
              <span class="mono" aria-hidden="true">{{ r.monogram }}</span>
            }
            {{ r.title }} · {{ r.orgName }}
            @if (r.placeholder) {
              <span class="chip">sample</span>
            }
          </h3>
          <p class="type">{{ r.employment }} · {{ r.location }}</p>
          @if (r.summary) {
            <p class="summary">{{ r.summary }}</p>
          }
          @if (r.highlights.length) {
            <ul class="highlights">
              @for (h of r.highlights; track $index) {
                <li>
                  {{ h.text }}
                  @if (h.project) {
                    <a [routerLink]="['/work', h.project]">case study →</a>
                  }
                </li>
              }
            </ul>
          }
        </li>
      }
    </ol>
  `,
  styleUrl: './experience-timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceTimeline {
  readonly experience = input.required<Experience>();

  protected readonly roles = computed(() => {
    const { roles, organizations } = this.experience();
    const orgs = new Map(organizations.map((o) => [o.id, o]));
    return [...roles].sort(byRecency).map((r) => ({
      ...r,
      orgName: orgs.get(r.org)?.name ?? r.org,
      monogram: orgs.get(r.org)?.monogram,
      period: formatPeriod(r.start, r.end),
      employment: formatEmployment(r.employmentType, r.workplace),
    }));
  });
}
