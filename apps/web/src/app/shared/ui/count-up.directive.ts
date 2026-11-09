import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

import { MediaPrefs } from '../../core/motion/media-prefs.service';

/** Splits "30+" into 30 and "+"; non-numeric values are left alone. */
export function parseStat(value: string): { n: number; prefix: string; suffix: string } | null {
  const m = /^(\D*)(\d+)(.*)$/.exec(value);
  if (!m) return null;
  return { prefix: m[1] ?? '', n: Number(m[2]), suffix: m[3] ?? '' };
}

/**
 * Counts a number up from 0 when it scrolls into view (prototype data-count).
 * The server renders the final value, so crawlers and no-JS users see real numbers.
 */
@Directive({ selector: '[appCountUp]' })
export class CountUp {
  readonly appCountUp = input.required<string>();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const prefs = inject(MediaPrefs);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const stat = parseStat(this.appCountUp());
      if (!stat || prefs.reducedMotion()) return;
      let raf = 0;
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const step = (now: number) => {
          const k = Math.min(1, (now - start) / 1200);
          const eased = 1 - Math.pow(1 - k, 3);
          el.textContent = `${stat.prefix}${String(Math.round(stat.n * eased))}${stat.suffix}`;
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      });
      observer.observe(el);
      destroyRef.onDestroy(() => {
        observer.disconnect();
        cancelAnimationFrame(raf);
      });
    });
  }
}
