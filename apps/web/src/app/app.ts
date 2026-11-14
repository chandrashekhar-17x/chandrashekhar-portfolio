import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { CommandService } from './core/commands/command.service';
import { ChatWidget } from './features/chat/chat-widget';
import { CommandPalette } from './layout/command-palette/command-palette';
import { SiteExtras } from './layout/extras/site-extras';
import { SiteFooter } from './layout/site-footer/site-footer';
import { SiteNav } from './layout/site-nav/site-nav';

// Root shell: skip link, nav, routed page, footer, plus the chat and ⌘K palette,
// plus the extras (blueprint mode, console API), which load lazily when the browser is idle or after 1.5 s (not needed for first paint).
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SiteNav, SiteFooter, ChatWidget, CommandPalette, SiteExtras],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKey($event)' },
})
export class App {
  private readonly commands = inject(CommandService);

  constructor() {
    // Router anchor scrolling (/#work) computes positions itself and ignores CSS
    // scroll-margin, so tell it about the sticky nav: sections land just below it.
    inject(ViewportScroller).setOffset(() => [
      0,
      document.querySelector('app-site-nav')?.getBoundingClientRect().height ?? 0,
    ]);
  }

  /** ⌘K (Mac) / Ctrl+K (others) toggles the command palette from anywhere. */
  protected onKey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.commands.toggle();
    }
  }
}
