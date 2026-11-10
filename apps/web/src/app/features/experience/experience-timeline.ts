import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Experience } from '../../core/content/content.types.gen';
import { formatEmployment, formatPeriod } from './format-period';
import { groupRoles } from './group-roles';

/** LinkedIn-style timeline: one entry per company, its roles listed underneath. */
@Component({
  selector: 'app-experience-timeline',
  imports: [RouterLink],
  templateUrl: './experience-timeline.html',
  styleUrl: './experience-timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienceTimeline {
  readonly experience = input.required<Experience>();

  protected readonly groups = computed(() =>
    groupRoles(this.experience()).map((g) => ({
      ...g,
      roles: g.roles.map((r) => ({
        ...r,
        period: formatPeriod(r.start, r.end),
        employment: formatEmployment(r.employmentType, r.workplace),
      })),
    })),
  );
}
