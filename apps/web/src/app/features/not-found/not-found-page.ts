import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageHeader } from '../../shared/ui/page-header/page-header';

/** Any unknown URL. The server sends HTTP 404 (see app.routes.server.ts). */
@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, PageHeader],
  template: `
    <app-page-header
      eyebrow="404"
      title="This page wandered off."
      lead="The link may be old or mistyped."
    />
    <a routerLink="/" class="btn btn--primary">Back home →</a>
  `,
  styleUrls: ['../../shared/ui/page-header/page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
