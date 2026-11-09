import { DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

import { MediaPrefs } from '../../core/motion/media-prefs.service';

const MAX_PULL_PX = 8; // docs/Design.md: magnetic buttons max 8px pull

/**
 * Button leans towards the pointer while hovered (prototype .magnetic).
 * Listeners are added manually (not @HostListener) so pointer moves never
 * schedule Angular change detection. Off for touch and reduced motion.
 */
@Directive({ selector: '[appMagnetic]' })
export class Magnetic {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const prefs = inject(MediaPrefs);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const move = (e: PointerEvent) => {
        if (!prefs.richMotion) return;
        const box = el.getBoundingClientRect();
        const x = (e.clientX - box.left - box.width / 2) / box.width;
        const y = (e.clientY - box.top - box.height / 2) / box.height;
        el.style.transform = `translate(${String(x * MAX_PULL_PX)}px, ${String(y * MAX_PULL_PX)}px)`;
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
