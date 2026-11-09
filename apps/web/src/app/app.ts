import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteNav } from './layout/site-nav/site-nav';

// Root shell: skip link, nav, routed page, footer.
// Cursor, splash cursor, chat and ⌘K palette are added in later Phase 1 PRs.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteNav, SiteFooter],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
