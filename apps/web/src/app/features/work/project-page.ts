import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  RESPONSE_INIT,
  computed,
  inject,
  input,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { tap } from 'rxjs';

import { ChatStore } from '../../core/chat/chat-store.service';
import { ContentRepository } from '../../core/content/content-repository';
import { articleSchema } from '../../core/seo/article-schema';
import { SeoService } from '../../core/seo/seo.service';
import { SITE_CONFIG } from '../../core/seo/site-config';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { CaseStudyBody } from './case-study/case-study-body';
import { ProjectIllustration } from './project-illustration';
import { projectEyebrow } from './project-meta';
import { sortProjects } from './work-filters';

/** /work/:slug: a case study rendered from markdown. Unknown slug → 404 page + status. */
@Component({
  selector: 'app-project-page',
  imports: [RouterLink, PageHeader, ProjectIllustration, CaseStudyBody],
  templateUrl: './project-page.html',
  styleUrls: ['../../shared/ui/page-header/page.scss', './project-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPage {
  /** Bound from the route param (withComponentInputBinding). */
  readonly slug = input.required<string>();

  private readonly repo = inject(ContentRepository);
  private readonly response = inject(RESPONSE_INIT, { optional: true });
  private readonly seo = inject(SeoService);
  private readonly site = inject(SITE_CONFIG);
  private readonly chat = inject(ChatStore);

  constructor() {
    // Only case-study pages carry the Article data.
    inject(DestroyRef).onDestroy(() => {
      this.seo.removeJsonLd('ld-article');
    });
  }

  /** Opens the agent with this project as the question; its answer cites the graph. */
  protected ask(title: string): void {
    this.chat.ask(`Tell me about ${title}`);
  }

  protected readonly project = rxResource({
    params: () => this.slug(),
    stream: ({ params: slug }) =>
      this.repo.project(slug).pipe(
        tap((p) => {
          // On the server, tell crawlers this page doesn't exist.
          if (!p && this.response) this.response.status = 404;
          if (p) {
            const image = `/og/work/${p.slug}.jpg`; // made by scripts/gen-og.mjs
            this.seo.update({
              title: `${p.title} · Chandrashekhar`,
              description: p.summary,
              path: `/work/${p.slug}`,
              type: 'article',
              image,
            });
            this.seo.jsonLd('ld-article', articleSchema(this.site.url, p, image));
          }
        }),
      ),
  });

  protected readonly eyebrow = projectEyebrow;

  /** Markdown body without frontmatter or the title line (the header shows those). */
  protected readonly body = computed(() => stripTitle(this.project.value()?.bodyMarkdown ?? ''));

  /** Previous / next project in /work order, for the pager at the bottom. */
  private readonly all = toSignal(this.repo.projects(), { initialValue: [] });
  protected readonly neighbours = computed(() => {
    const list = sortProjects(this.all());
    const i = list.findIndex((p) => p.slug === this.slug());
    return { prev: i > 0 ? list[i - 1] : undefined, next: i >= 0 ? list[i + 1] : undefined };
  });
}

/**
 * Drops YAML frontmatter, comments and the leading "# Title" line:
 * the page header already shows the title (the one h1) and the facts.
 */
export function stripTitle(md: string): string {
  return md
    .replace(/^---\n[\s\S]*?\n---\n/, '')
    .replace(/^\s*(<!--[\s\S]*?-->\s*)*(#\s[^\n]*\n)?/, '');
}
