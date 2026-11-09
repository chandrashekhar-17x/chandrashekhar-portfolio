import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';

// Home page. PR 2 replaces this intro with the hero; later PRs add the
// lazy sections (graph, work, lab, experience, contact) behind @defer.
@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly profile = toSignal(inject(ContentRepository).profile());
}
