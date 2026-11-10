import { DestroyRef, Injectable, PLATFORM_ID, Signal, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * User/device preferences as signals, kept live when they change.
 * On the server everything reports the "calm" default (reduced motion, no fine pointer),
 * so effects never start during SSR.
 */
@Injectable({ providedIn: 'root' })
export class MediaPrefs {
  readonly reducedMotion: Signal<boolean>;
  /** true for a mouse/trackpad; false for touch screens. */
  readonly finePointer: Signal<boolean>;

  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.reducedMotion = this.watch('(prefers-reduced-motion: reduce)', true);
    this.finePointer = this.watch('(hover: hover) and (pointer: fine)', false);
  }

  /** Effects like the cursor and tilt run only when this is true. */
  get richMotion(): boolean {
    return this.finePointer() && !this.reducedMotion();
  }

  private watch(query: string, serverValue: boolean): Signal<boolean> {
    if (!this.browser) return signal(serverValue).asReadonly();
    const mql = window.matchMedia(query);
    const value = signal(mql.matches);
    const onChange = (e: MediaQueryListEvent) => {
      value.set(e.matches);
    };
    mql.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => {
      mql.removeEventListener('change', onChange);
    });
    return value.asReadonly();
  }
}
