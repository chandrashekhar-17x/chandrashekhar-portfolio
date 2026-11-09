import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

import { MediaPrefs } from '../../core/motion/media-prefs.service';

const MAX_TILT_DEG = 7; // docs/Design.md: tilt cards max 8°

/**
 * 3D tilt towards the pointer plus a moving glare spot (prototype .pcard).
 * Writes `transform` and the --gx/--gy custom properties directly (no change
 * detection). Off for touch screens and reduced motion.
 */
@Directive({ selector: '[appTilt]' })
export class Tilt {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const prefs = inject(MediaPrefs);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const move = (e: PointerEvent) => {
        if (!prefs.richMotion) return;
        const box = el.getBoundingClientRect();
        const x = (e.clientX - box.left) / box.width; // 0 … 1
        const y = (e.clientY - box.top) / box.height;
        const ry = (x - 0.5) * 2 * MAX_TILT_DEG;
        const rx = (0.5 - y) * 2 * MAX_TILT_DEG;
        el.style.transform = `rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
        el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
      };
      const reset = () => {
        el.style.transform = '';
      };
      el.addEventListener('pointermove', move, { passive: true });
      el.addEventListener('pointerleave', reset);
      destroyRef.onDestroy(() => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', reset);
      });
    });
  }
}
