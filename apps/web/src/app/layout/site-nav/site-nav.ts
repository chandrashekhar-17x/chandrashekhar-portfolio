import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

import { ContentRepository } from '../../core/content/content-repository';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { NAV_LINKS } from './nav-links';

/** Sticky top bar: logo, section links, theme toggle, and a menu on small screens. */
@Component({
  selector: 'app-site-nav',
  imports: [RouterLink, ThemeToggle],
  templateUrl: './site-nav.html',
  styleUrl: './site-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteNav {
  protected readonly links = NAV_LINKS;
  protected readonly profile = toSignal(inject(ContentRepository).profile());
  protected readonly menuOpen = signal(false);

  constructor() {
    // Close the mobile menu after any navigation.
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
      });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }
}
