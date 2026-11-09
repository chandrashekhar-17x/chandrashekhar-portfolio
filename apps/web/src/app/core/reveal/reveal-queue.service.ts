import { Injectable, inject } from '@angular/core';

import { MediaPrefs } from '../motion/media-prefs.service';

/**
 * Makes lazy sections (and project cards) appear one at a time.
 *
 * `@defer (on viewport)` downloads each section's code when it scrolls into view,
 * possibly several at once. Each section then asks for a turn here; turns are
 * handed out in request order, with a short pause between them, so content
 * reveals sequentially like the prototype. Reduced motion → no pauses.
 */
@Injectable({ providedIn: 'root' })
export class RevealQueue {
  private readonly prefs = inject(MediaPrefs);
  private tail: Promise<void> = Promise.resolve();

  /**
   * Runs `reveal` after every earlier request has had its turn.
   * @param holdMs how long the next item waits after this one is revealed.
   */
  enqueue(reveal: () => void, holdMs = 350): Promise<void> {
    const hold = this.prefs.reducedMotion() ? 0 : holdMs;
    const turn = this.tail.then(async () => {
      reveal();
      if (hold > 0) await delay(hold);
    });
    // A failing reveal must not block everything after it.
    this.tail = turn.catch(() => undefined);
    return turn;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
