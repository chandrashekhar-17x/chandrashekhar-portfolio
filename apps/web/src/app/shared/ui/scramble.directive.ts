import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { graphemes } from '../../core/text/graphemes';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#01';

/**
 * Frame `f` of the "decode" effect: the first f/2 characters are final, the rest
 * random glyphs (spaces stay spaces). Pure, so it is easy to test.
 */
export function scrambleFrame(text: string, frame: number, random: () => number): string {
  return graphemes(text)
    .map((ch, i) =>
      i < frame / 2 || ch === ' ' ? ch : (GLYPHS[Math.floor(random() * GLYPHS.length)] ?? ch),
    )
    .join('');
}

/**
 * Text "decodes" from random glyphs when it scrolls into view (prototype .scramble).
 * Screen readers always get the real text via aria-label. Off for reduced motion.
 */
@Directive({ selector: '[appScramble]' })
export class Scramble {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const prefs = inject(MediaPrefs);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const text = el.textContent;
      if (prefs.reducedMotion() || !text) return;
      el.setAttribute('aria-label', text);
      let timer: ReturnType<typeof setInterval> | undefined;
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        let frame = 0;
        timer = setInterval(() => {
          el.textContent = scrambleFrame(text, frame, Math.random);
          if (++frame > text.length * 2) {
            clearInterval(timer);
            el.textContent = text;
          }
        }, 30);
      });
      observer.observe(el);
      destroyRef.onDestroy(() => {
        observer.disconnect();
        clearInterval(timer);
        el.textContent = text;
      });
    });
  }
}
