import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ContentRepository } from '../../core/content/content-repository';
import { PageHeader } from '../../shared/ui/page-header/page-header';

/** /work: every project, fully server-rendered (crawlable). Card styling lands in PR 4. */
@Component({
  selector: 'app-work-page',
  imports: [RouterLink, PageHeader],
  template: `
    <app-page-header
      eyebrow="Selected work"
      title="Things I've built."
      lead="Editors, renderers, data-heavy UIs, and the AI systems I'm building now."
    />
    <ul class="list" role="list">
      @for (p of projects(); track p.slug) {
        <li>
          <h2>
            <a [routerLink]="['/work', p.slug]">{{ p.title }}</a>
          </h2>
          <p class="muted">{{ p.summary }}</p>
        </li>
      }
    </ul>
  `,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  styles: `
    .list {
      display: grid;
      gap: var(--space-6);
      padding: 0;
      list-style: none;
    }
    h2 {
      font-size: var(--text-xl);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkPage {
  protected readonly projects = toSignal(inject(ContentRepository).projects(), {
    initialValue: [],
  });
}
