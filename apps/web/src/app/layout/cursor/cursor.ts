import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { cursorLabelFor } from './cursor-label';

/**
 * Glowing arrow cursor that leans with movement and shows context labels
 * ("open", "drag", "ask me", "click"). Only created for mouse users without
 * reduced motion (the app shell checks MediaPrefs.richMotion).
 */
@Component({
  selector: 'app-cursor',
  template: `
    <div
      #cursor
      class="cursor"
      [class.act]="label()"
      [class.press]="pressed()"
      [class.hidden]="hidden()"
    >
      <svg #arrow viewBox="0 0 24 24" width="26" height="26">
        <path d="M3 2 L21 10.5 L12.6 12.8 L9.2 21 Z" />
      </svg>
      <span class="label">{{ label() }}</span>
    </div>
  `,
  styleUrl: './cursor.scss',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cursor {
  protected readonly label = signal('');
  protected readonly hidden = signal(true); // until the first pointer move
  protected readonly pressed = signal(false);

  private readonly cursor = viewChild.required<ElementRef<HTMLElement>>('cursor');
  private readonly arrow = viewChild.required<ElementRef<SVGElement>>('arrow');

  constructor() {
    const doc = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      doc.documentElement.classList.add('custom-cursor'); // hides the native arrow (CSS)
      const target = { x: -100, y: -100 };
      const pos = { x: -100, y: -100 };
      let angle = 0;
      let tilt = 0;
      let lastX = 0;
      let raf = 0;

      const move = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        wake();
        target.x = e.clientX;
        target.y = e.clientY;
        tilt = Math.max(-28, Math.min(28, (e.clientX - lastX) * 1.6)); // lean with speed
        lastX = e.clientX;
        const ctx = cursorLabelFor(e.target instanceof Element ? e.target : null);
        if (ctx.label !== this.label()) this.label.set(ctx.label); // change detection only on change
        if (ctx.hidden !== this.hidden()) this.hidden.set(ctx.hidden);
      };
      const down = () => {
        this.pressed.set(true);
      };
      const up = () => {
        this.pressed.set(false);
      };
      const leave = () => {
        this.hidden.set(true);
      };

      // Smooth follow: ease towards the pointer (transform only → GPU). The loop sleeps
      // once the arrow has caught up, so a still mouse costs nothing.
      const frame = () => {
        pos.x += (target.x - pos.x) * 0.45;
        pos.y += (target.y - pos.y) * 0.45;
        angle += (tilt - angle) * 0.18;
        tilt *= 0.85;
        this.cursor().nativeElement.style.transform = `translate(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px)`;
        this.arrow().nativeElement.style.transform = `rotate(${angle.toFixed(1)}deg)`;
        const settled =
          Math.abs(target.x - pos.x) < 0.1 &&
          Math.abs(target.y - pos.y) < 0.1 &&
          Math.abs(angle) < 0.1;
        raf = settled ? 0 : requestAnimationFrame(frame);
      };
      const wake = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };

      addEventListener('pointermove', move, { passive: true });
      addEventListener('pointerdown', down);
      addEventListener('pointerup', up);
      doc.documentElement.addEventListener('pointerleave', leave);
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(raf);
        removeEventListener('pointermove', move);
        removeEventListener('pointerdown', down);
        removeEventListener('pointerup', up);
        doc.documentElement.removeEventListener('pointerleave', leave);
        doc.documentElement.classList.remove('custom-cursor');
      });
    });
  }
}
