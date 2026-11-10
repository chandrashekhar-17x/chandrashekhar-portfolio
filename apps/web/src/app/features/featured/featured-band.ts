import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';

import { ContentRepository } from '../../core/content/content-repository';
import { Reveal } from '../../shared/ui/reveal/reveal';
import { CadDrawing } from './cad-drawing';
import { journeySteps, tldrBullets } from './tldr';

/**
 * "Featured case study" band (lazy chunk): the first featured project, its TL;DR
 * and R&D journey read from the case-study markdown, beside an animated drawing.
 */
@Component({
  selector: 'app-featured-band',
  imports: [Reveal, RouterLink, CadDrawing],
  templateUrl: './featured-band.html',
  styleUrl: './featured-band.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedBand {
  private readonly repo = inject(ContentRepository);

  protected readonly project = toSignal(
    this.repo.projects().pipe(
      map((ps) => ps.find((p) => p.featured)),
      switchMap((p) => (p ? this.repo.project(p.slug) : of(undefined))),
    ),
  );
  protected readonly tldr = computed(() => tldrBullets(this.project()?.bodyMarkdown ?? ''));
  protected readonly journey = computed(() => journeySteps(this.project()?.bodyMarkdown ?? ''));
}
