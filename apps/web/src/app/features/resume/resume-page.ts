import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ContentRepository } from '../../core/content/content-repository';
import { Skill } from '../../core/content/content.types.gen';
import { ExperienceTimeline } from '../experience/experience-timeline';
import { CATEGORIES } from '../graph/graph-categories';

/**
 * /resume: an HTML resume built from content (server-rendered, crawlable).
 * Print styles make "Print → Save as PDF" produce a clean document until the
 * real resume.pdf is added in content/resume/.
 */
const RANK: Record<NonNullable<Skill['proficiency']>, number> = { strong: 0, good: 1, learning: 2 };

@Component({
  selector: 'app-resume-page',
  imports: [RouterLink, ExperienceTimeline],
  templateUrl: './resume-page.html',
  styleUrls: ['../../shared/ui/page-header/page.scss', './resume-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumePage {
  private readonly repo = inject(ContentRepository);
  protected readonly profile = toSignal(this.repo.profile());
  protected readonly experience = toSignal(this.repo.experience());
  protected readonly projects = toSignal(this.repo.projects(), { initialValue: [] });
  protected readonly education = toSignal(this.repo.education(), { initialValue: [] });
  private readonly skills = toSignal(this.repo.skills(), { initialValue: [] });

  /** Skills grouped by category, strongest first. */
  protected readonly skillGroups = computed(() =>
    CATEGORIES.map((c) => ({
      label: c.label,
      // Real skills only (concept nodes carry no proficiency), strongest first.
      skills: this.skills()
        .filter((s: Skill) => s.category === c.key && s.proficiency)
        .sort((a, b) => RANK[a.proficiency ?? 'learning'] - RANK[b.proficiency ?? 'learning']),
    })).filter((g) => g.skills.length > 0),
  );

  protected print(): void {
    window.print();
  }
}
