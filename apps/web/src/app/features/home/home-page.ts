import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';
import { HeroSection } from '../hero/hero-section';
import { StatsStrip } from '../stats/stats-strip';

// Home page. Hero + stats are server-rendered (first paint, SEO).
// Later PRs add the lazy sections (graph, work, lab, experience, contact) behind @defer.
@Component({
  selector: 'app-home-page',
  imports: [HeroSection, StatsStrip],
  templateUrl: './home-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly repo = inject(ContentRepository);
  protected readonly profile = toSignal(this.repo.profile());
  protected readonly skills = toSignal(this.repo.skills(), { initialValue: [] });
}
