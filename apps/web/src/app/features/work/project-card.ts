import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { Project, Skill } from '../../core/content/content.types.gen';
import { RevealQueue } from '../../core/reveal/reveal-queue.service';
import { Tilt } from '../../shared/ui/tilt.directive';
import { ProjectIllustration } from './project-illustration';
import { projectKind } from './project-meta';

/**
 * Project card with 3D tilt + glare (prototype .pcard).
 * `staggered`: shows its own skeleton until its turn in the RevealQueue, so cards
 * fill in one by one on the home page. On /work it renders straight away.
 */
@Component({
  selector: 'app-project-card',
  imports: [RouterLink, Tilt, ProjectIllustration],
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCard {
  readonly project = input.required<Project>();
  readonly skills = input.required<ReadonlyMap<string, Skill>>();
  readonly staggered = input(false);

  /** Area tag: the most common category among the project's skills. */
  protected readonly area = computed(() => projectArea(this.project(), this.skills()));
  protected readonly tags = computed(() => this.project().tags.slice(0, 3));
  protected readonly kind = computed(() => projectKind(this.project()));

  /** Server render and /work: loaded. Home: wait for the queue. */
  protected readonly loading = signal(false);

  constructor() {
    const queue = inject(RevealQueue);
    afterNextRender(() => {
      if (!this.staggered()) return;
      this.loading.set(true);
      void queue.enqueue(() => {
        this.loading.set(false);
      }, 260);
    });
  }
}

/** Tie-break order: AI work is the story this portfolio tells, so it wins ties. */
const AREA_PRIORITY: Skill['category'][] = [
  'ai',
  'cad',
  'documents',
  'realtime',
  'backend',
  'performance',
  'leadership',
  'fundamentals',
  'frontend',
];

export function projectArea(
  project: Project,
  skills: ReadonlyMap<string, Skill>,
): Skill['category'] {
  const counts = new Map<Skill['category'], number>();
  for (const id of project.skills) {
    const category = skills.get(id)?.category;
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  let best: Skill['category'] = 'frontend';
  let bestCount = 0;
  for (const category of AREA_PRIORITY) {
    const n = counts.get(category) ?? 0;
    if (n > bestCount) {
      best = category;
      bestCount = n;
    }
  }
  return best;
}
