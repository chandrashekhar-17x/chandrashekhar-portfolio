import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ChatStore } from '../../core/chat/chat-store.service';
import { ContentRepository } from '../../core/content/content-repository';
import { experienceYears, formatMonth } from '../../core/time/duration';
import { sortProjects } from '../work/work-filters';

/** How many of each list fit on one screen. */
const TOP_PROJECTS = 3;
const TOP_SKILLS = 10;

/**
 * /recruiter: the whole profile on one screen, for people who skim. Role, years,
 * strongest stack, three best projects, experience and every way to reach me.
 * Server-rendered from the same content as the rest of the site.
 */
@Component({
  selector: 'app-recruiter-page',
  imports: [RouterLink],
  templateUrl: './recruiter-page.html',
  styleUrl: './recruiter-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecruiterPage {
  private readonly repo = inject(ContentRepository);
  private readonly chat = inject(ChatStore);

  protected readonly profile = toSignal(this.repo.profile());
  private readonly experience = toSignal(this.repo.experience());
  private readonly projects = toSignal(this.repo.projects(), { initialValue: [] });
  private readonly skills = toSignal(this.repo.skills(), { initialValue: [] });
  protected readonly education = toSignal(this.repo.education(), { initialValue: [] });

  protected readonly years = computed(() => experienceYears(this.experience()?.roles ?? []));
  protected readonly best = computed(() => sortProjects(this.projects()).slice(0, TOP_PROJECTS));
  protected readonly stack = computed(() =>
    this.skills()
      .filter((s) => s.proficiency === 'strong')
      .slice(0, TOP_SKILLS),
  );
  /** Roles newest first with their organization's name and a "Jan 2024 – Present" span. */
  protected readonly roles = computed(() => {
    const xp = this.experience();
    if (!xp) return [];
    const org = new Map(xp.organizations.map((o) => [o.id, o.name]));
    return [...xp.roles]
      .sort((a, b) => b.start.localeCompare(a.start))
      .map((r) => ({
        id: r.id,
        title: r.title,
        type: r.employmentType,
        org: org.get(r.org) ?? r.org,
        span: `${formatMonth(r.start)} – ${r.end ? formatMonth(r.end) : 'Present'}`,
      }));
  });

  protected matchJd(): void {
    this.chat.ask('Does he fit an Angular + AI role? (JD match)');
  }
}
