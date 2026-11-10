import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ChatStore } from '../../core/chat/chat-store.service';
import { ContentRepository } from '../../core/content/content-repository';
import { CoreOrb } from './core-orb';
import { DEMO_LAB_STATUS } from './lab-status.mock';

/** Three HUD panels: agents + models · core orb + mic · learning timeline + metrics. */
@Component({
  selector: 'app-lab-hud',
  imports: [CoreOrb],
  templateUrl: './lab-hud.html',
  styleUrl: './lab-hud.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabHud {
  protected readonly status = DEMO_LAB_STATUS;
  protected readonly lab = toSignal(inject(ContentRepository).lab());
  protected readonly year = new Date().getFullYear();

  protected readonly listening = signal(false);
  protected readonly micText = signal('Tap to speak (demo)');
  protected readonly pulse = signal(0);
  private readonly chat = inject(ChatStore);
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.timers.forEach(clearTimeout);
    });
  }

  /** Demo only: pulses the orb, then asks the chat. Real voice ("Jarvis") is Phase 6. */
  protected speak(): void {
    if (this.listening()) return;
    this.listening.set(true);
    this.micText.set('Listening… (simulated, the mic stays off)');
    this.pulse.update((n) => n + 1);
    this.timers.push(
      setTimeout(() => {
        this.micText.set('"What are his key skills?" → answering in the chat');
        this.pulse.update((n) => n + 1);
        this.chat.ask('What are his key skills?');
      }, 1600),
      setTimeout(() => {
        this.listening.set(false);
        this.micText.set('Tap to speak (demo)');
      }, 4200),
    );
  }
}
