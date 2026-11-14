import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ContentRepository } from '../../core/content/content-repository';
import { Skill } from '../../core/content/content.types.gen';
import { RESUME_PDF } from '../../core/seo/site-origin.gen';
import { ExperienceTimeline } from '../experience/experience-timeline';
import { CATEGORIES } from '../graph/graph-categories';

/**
 * /resume, in two versions:
 * - "Portfolio resume": built from content/ (server-rendered, crawlable); print
 *   styles make "Print → Save as PDF" a clean document.
 * - "My resume": the PDF I maintain (content/resume/resume.pdf), embedded with a
 *   download link. `/resume#pdf` opens that tab directly.
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

  /** Path of the PDF in the build (null when content/resume/resume.pdf is missing). */
  protected readonly pdfUrl = RESUME_PDF;
  protected readonly safePdf = RESUME_PDF
    ? inject(DomSanitizer).bypassSecurityTrustResourceUrl(RESUME_PDF)
    : null;
  protected readonly tab = signal<'site' | 'pdf'>('site');

  constructor() {
    // Server HTML is always the crawlable portfolio resume; #pdf switches after load.
    afterNextRender(() => {
      if (location.hash === '#pdf' && this.pdfUrl) this.tab.set('pdf');
    });
  }

  protected show(tab: 'site' | 'pdf'): void {
    this.tab.set(tab);
    // Full path: a bare '#pdf' would resolve against <base href="/">.
    history.replaceState(null, '', location.pathname + (tab === 'pdf' ? '#pdf' : ''));
  }

  /** Arrow keys move between the two tabs (WAI-ARIA tabs pattern). */
  protected onTabKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next = this.tab() === 'site' ? 'pdf' : 'site';
    this.show(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  protected print(): void {
    window.print();
  }
}
