import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, map } from 'rxjs';

import { ContentRepository } from '../../core/content/content-repository';
import { personSchema } from '../../core/seo/person-schema';
import { SeoService } from '../../core/seo/seo.service';
import { SITE_CONFIG } from '../../core/seo/site-config';
import { SectionSkeleton } from '../../shared/ui/section-skeleton/section-skeleton';
import { GraphSection } from '../graph/graph-section';
import { HeroSection } from '../hero/hero-section';
import { StatsStrip } from '../stats/stats-strip';
import { ContactSection } from '../contact/contact-section';
import { ExperienceSection } from '../experience/experience-section';
import { LabSection } from '../lab/lab-section';
import { WorkSection } from '../work/work-section';

// Home page. Hero + stats are server-rendered (first paint, SEO).
// Each later section is a lazy chunk behind @defer (see home-page.html).
@Component({
  selector: 'app-home-page',
  imports: [
    HeroSection,
    StatsStrip,
    SectionSkeleton,
    GraphSection,
    WorkSection,
    LabSection,
    ExperienceSection,
    ContactSection,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly repo = inject(ContentRepository);
  protected readonly profile = toSignal(this.repo.profile());
  protected readonly skills = toSignal(this.repo.skills(), { initialValue: [] });
  /** Skeleton card count = real card count, so the placeholder has the same size. */
  protected readonly featuredCount = toSignal(
    this.repo.projects().pipe(map((ps) => ps.filter((p) => p.featured).length)),
    { initialValue: 3 },
  );
  protected readonly roleCount = toSignal(
    this.repo.experience().pipe(map((xp) => xp.roles.length)),
    { initialValue: 3 },
  );

  constructor() {
    // Structured data (JSON-LD) about me, rendered on the server for crawlers.
    const seo = inject(SeoService);
    const site = inject(SITE_CONFIG);
    combineLatest([
      this.repo.profile(),
      this.repo.skills(),
      this.repo.experience(),
      this.repo.projects(),
    ]).subscribe(([profile, skills, experience, projects]) => {
      seo.jsonLd('ld-person', personSchema(site.url, profile, skills, experience, projects));
    });
    inject(DestroyRef).onDestroy(() => {
      seo.removeJsonLd('ld-person'); // only the home page carries it
    });
  }
}
