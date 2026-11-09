import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Project, Skill } from '../../core/content/content.types.gen';
import { ProjectCard } from './project-card';

/** Responsive grid of project cards: 3 → 2 → 1 columns by container width. */
@Component({
  selector: 'app-project-grid',
  imports: [ProjectCard],
  template: `
    <ul class="grid" role="list">
      @for (p of projects(); track p.slug) {
        <li>
          <app-project-card [project]="p" [skills]="skillMap()" [staggered]="staggered()" />
        </li>
      }
    </ul>
  `,
  styles: `
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      margin: 0;
      padding: 0;
      list-style: none;
      perspective: 1000px; // gives the card tilt real depth

      @container site (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @container site (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectGrid {
  readonly projects = input.required<readonly Project[]>();
  readonly skills = input.required<readonly Skill[]>();
  readonly staggered = input(false);

  protected readonly skillMap = computed(() => new Map(this.skills().map((s) => [s.id, s])));
}
