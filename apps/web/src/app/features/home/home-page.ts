import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';
import { SectionSkeleton } from '../../shared/ui/section-skeleton/section-skeleton';
import { GraphSection } from '../graph/graph-section';
import { HeroSection } from '../hero/hero-section';
import { StatsStrip } from '../stats/stats-strip';

// Home page. Hero + stats are server-rendered (first paint, SEO).
// Each later section is a lazy chunk behind @defer (see home-page.html).
@Component({
  selector: 'app-home-page',
  imports: [HeroSection, StatsStrip, SectionSkeleton, GraphSection],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly repo = inject(ContentRepository);
  protected readonly profile = toSignal(this.repo.profile());
  protected readonly skills = toSignal(this.repo.skills(), { initialValue: [] });
}
