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
  private readonly skills = toSignal(this.repo.skills(), { initialValue: [] });

  /** Skills grouped by category, strongest first. */
  protected readonly skillGroups = computed(() =>
    CATEGORIES.map((c) => ({
      label: c.label,
      skills: this.skills()
        .filter((s: Skill) => s.category === c.key)
        .sort((a, b) => b.level - a.level),
    })).filter((g) => g.skills.length > 0),
  );

  protected print(): void {
    window.print();
  }
}
