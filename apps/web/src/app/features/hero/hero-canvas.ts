import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';

import { AnimationLoop } from '../../core/motion/animation-loop';
import { fitCanvas } from '../../core/motion/canvas';
import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { seededRandom } from '../../core/motion/seeded-random';
import { ThemeService } from '../../core/theme/theme.service';
import { HeroFrame, Star, createStars, drawHeroScene } from './hero-scene';

/** Canvas behind the hero. Browser-only; paused off-screen; still image for reduced motion. */
@Component({
  selector: 'app-hero-canvas',
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
  styles: `
    :host,
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCanvas {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly theme = inject(ThemeService);
  private readonly prefs = inject(MediaPrefs);
  private readonly destroyRef = inject(DestroyRef);
  /** Set once the canvas is ready; redraws a single frame. */
  private redraw?: () => void;

  constructor() {
    afterNextRender(() => {
      this.start();
    });
    // Theme change → repaint immediately (matters when the loop is paused or off).
    effect(() => {
      this.theme.theme();
      this.redraw?.();
    });
  }

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const host = canvas.parentElement?.parentElement ?? canvas; // the hero section
    let fitted = fitCanvas(canvas);
    let stars: Star[] = fitted ? createStars(fitted.width, fitted.height, seededRandom(7)) : [];
    let t = 0;
    const mouse = { x: 0, y: 0 };

    const draw = (dt: number) => {
      if (!fitted) return;
      const still = this.prefs.reducedMotion();
      t += still ? 0 : dt * 0.48; // prototype: +0.008 per 60 fps frame
      const frame: HeroFrame = {
        width: fitted.width,
        height: fitted.height,
        t,
        mouseX: still ? 0 : mouse.x,
        mouseY: still ? 0 : mouse.y,
        light: this.theme.theme() === 'light',
      };
      drawHeroScene(fitted.ctx, stars, frame);
    };

    this.redraw = () => {
      draw(0);
    };
    draw(0);
    // Reduced motion: keep the single still frame, no loop at all.
    const loop = this.prefs.reducedMotion()
      ? null
      : new AnimationLoop(canvas, ({ dt }) => {
          draw(dt);
        });

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - box.left) / box.width - 0.5;
      mouse.y = (e.clientY - box.top) / box.height - 0.5;
    };
    const resize = new ResizeObserver(() => {
      fitted = fitCanvas(canvas);
      if (fitted) stars = createStars(fitted.width, fitted.height, seededRandom(7));
      draw(0);
    });
    host.addEventListener('pointermove', onMove, { passive: true });
    resize.observe(canvas);

    this.destroyRef.onDestroy(() => {
      loop?.destroy();
      resize.disconnect();
      host.removeEventListener('pointermove', onMove);
    });
  }
}
