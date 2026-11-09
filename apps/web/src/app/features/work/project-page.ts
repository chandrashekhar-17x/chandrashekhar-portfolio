import {
  ChangeDetectionStrategy,
  Component,
  RESPONSE_INIT,
  computed,
  inject,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { marked } from 'marked';
import { tap } from 'rxjs';

import { ContentRepository } from '../../core/content/content-repository';
import { PageHeader } from '../../shared/ui/page-header/page-header';

/** /work/:slug: a case study rendered from markdown. Unknown slug → 404 page + status. */
@Component({
  selector: 'app-project-page',
  imports: [RouterLink, PageHeader],
  templateUrl: './project-page.html',
  styleUrls: ['../../shared/ui/page-header/page.scss', './project-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPage {
  /** Bound from the route param (withComponentInputBinding). */
  readonly slug = input.required<string>();

  private readonly repo = inject(ContentRepository);
  private readonly response = inject(RESPONSE_INIT, { optional: true });

  protected readonly project = rxResource({
    params: () => this.slug(),
    stream: ({ params: slug }) =>
      this.repo.project(slug).pipe(
        tap((p) => {
          // On the server, tell crawlers this page doesn't exist.
          if (!p && this.response) this.response.status = 404;
        }),
      ),
  });

  /** Markdown → HTML. Angular's [innerHTML] sanitizer strips anything unsafe. */
  protected readonly html = computed(() => {
    const md = this.project.value()?.bodyMarkdown;
    return md ? marked.parse(stripTitle(md), { async: false }) : '';
  });
}

/** Drops comments and the leading "# Title" line: the page header already is the one h1. */
export function stripTitle(md: string): string {
  return md.replace(/^\s*(<!--[\s\S]*?-->\s*)*#\s[^\n]*\n/, '');
}
