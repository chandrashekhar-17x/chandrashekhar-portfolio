import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { TypeState, nextTypeStep } from './typewriter';

/**
 * "> I build <phrase>▍" with a typing/erasing loop.
 * SSR and reduced motion show the first phrase fully (static, readable).
 * Screen readers get the full list once instead of a constantly changing text.
 */
@Component({
  selector: 'app-typewriter',
  template: `
    <span class="sr-only">{{ prefix() }} {{ phrases().join(', ') }}.</span>
    <span aria-hidden="true">
      &gt; {{ prefix() }} <b>{{ text() }}</b
      ><span class="caret"></span>
    </span>
  `,
  styles: `
    :host {
      display: block;
      min-height: 1.6em;
      font-family: var(--font-mono);
      font-size: clamp(15px, 2.3cqi, 20px);
      color: var(--ink-2);
    }
    b {
      color: var(--ink);
      font-weight: 600;
    }
    .caret {
      display: inline-block;
      width: 9px;
      height: 1.1em;
      margin-left: 2px;
      vertical-align: -3px;
      background: var(--cyan);
      animation: blink 1s steps(1) infinite;
    }
    @keyframes blink {
      50% {
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .caret {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Typewriter {
  readonly phrases = input.required<readonly string[]>();
  readonly prefix = input('I build');

  /** null until typing starts in the browser. */
  private readonly typed = signal<string | null>(null);
  /** Before typing starts (SSR, reduced motion) show the first phrase in full. */
  protected readonly text = computed(() => this.typed() ?? this.phrases()[0] ?? '');
  private readonly prefs = inject(MediaPrefs);

  constructor() {
    const destroyRef = inject(DestroyRef);
    let timer: ReturnType<typeof setTimeout> | undefined;
    destroyRef.onDestroy(() => {
      clearTimeout(timer);
    });

    afterNextRender(() => {
      if (this.prefs.reducedMotion() || this.phrases().length === 0) return;
      let state: TypeState = { index: 0, chars: 0, deleting: false };
      const tick = () => {
        const step = nextTypeStep(this.phrases(), state);
        state = step.state;
        this.typed.set(step.text);
        timer = setTimeout(tick, step.delayMs);
      };
      tick();
    });
  }
}
