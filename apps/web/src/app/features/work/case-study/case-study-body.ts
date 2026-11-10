import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { parseCaseStudy } from './case-study';

/**
 * Case-study body: sticky table of contents + sections. TL;DR, "What I built"
 * chip groups and the hard-problems table get their own layouts; the rest is
 * markdown (Angular's [innerHTML] sanitizer strips anything unsafe).
 */
@Component({
  selector: 'app-case-study-body',
  imports: [RouterLink],
  templateUrl: './case-study-body.html',
  styleUrl: './case-study-body.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseStudyBody {
  /** Markdown without frontmatter or the "# Title" line. */
  readonly markdown = input.required<string>();
  /** Route of this page, so TOC links keep the path (routerLink + fragment). */
  readonly path = input.required<string>();

  protected readonly sections = computed(() => parseCaseStudy(this.markdown()));
  protected readonly toc = computed(() => this.sections().filter((s) => s.title));
}
