import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import { BlueprintService } from '../../core/blueprint/blueprint.service';
import { ChatStore } from '../../core/chat/chat-store.service';
import { CommandService } from '../../core/commands/command.service';
import { installConsoleApi } from '../../core/devtools/console-api';
import { ThemeService } from '../../core/theme/theme.service';
import { BlueprintOverlay } from '../blueprint/blueprint-overlay';

/**
 * The fun layer, loaded lazily with the palette: blueprint mode (+ its ⌘K command)
 * and the DevTools console API. Nothing here is needed for first paint.
 */
@Component({
  selector: 'app-site-extras',
  imports: [BlueprintOverlay],
  template: `
    @if (blueprint.on()) {
      <app-blueprint-overlay />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteExtras {
  protected readonly blueprint = inject(BlueprintService);

  constructor() {
    const router = inject(Router);
    const theme = inject(ThemeService);
    const chat = inject(ChatStore);

    const unregister = inject(CommandService).register([
      {
        id: 'action:blueprint',
        label: 'View this page as a blueprint',
        group: 'Actions',
        keywords: 'cad drawing dimensions wireframe easter egg',
        run: () => {
          this.blueprint.toggle();
        },
      },
    ]);
    inject(DestroyRef).onDestroy(unregister);

    afterNextRender(() => {
      installConsoleApi({
        ask: (q) => {
          chat.ask(q);
        },
        blueprint: () => {
          this.blueprint.toggle();
          return this.blueprint.on();
        },
        theme: () => {
          theme.toggle();
          return theme.theme();
        },
        hire: () => void router.navigate(['/'], { fragment: 'contact' }),
      });
    });
  }
}
