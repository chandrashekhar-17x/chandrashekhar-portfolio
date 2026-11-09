import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

import { ChatStore } from '../../core/chat/chat-store.service';
import { CommandService } from '../../core/commands/command.service';
import { ContentRepository } from '../../core/content/content-repository';
import { Magnetic } from '../../shared/ui/magnetic.directive';
import { ThemeToggle } from '../theme-toggle/theme-toggle';
import { NAV_LINKS } from './nav-links';

/** Sticky top bar: logo, section links, theme toggle, and a menu on small screens. */
@Component({
  selector: 'app-site-nav',
  imports: [RouterLink, ThemeToggle, Magnetic],
  templateUrl: './site-nav.html',
  styleUrl: './site-nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteNav {
  protected readonly links = NAV_LINKS;
  protected readonly profile = toSignal(inject(ContentRepository).profile());
  protected readonly menuOpen = signal(false);
  /** The logo's visible text, e.g. "CS.dev". */
  protected readonly logoText = computed(
    () => `${this.profile()?.initials ?? this.profile()?.name ?? ''}.dev`,
  );
  protected readonly commands = inject(CommandService);
  protected readonly chat = inject(ChatStore);
  /** "⌘K" on Apple devices, "Ctrl K" elsewhere (set after hydration). */
  protected readonly shortcut = signal('⌘K');

  constructor() {
    afterNextRender(() => {
      if (!/Mac|iPhone|iPad/.test(navigator.userAgent)) this.shortcut.set('Ctrl K');
    });
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
