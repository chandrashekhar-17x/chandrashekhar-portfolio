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
    /* Static sky behind the transparent canvas (painted once, not every frame). */
    canvas {
      background: linear-gradient(180deg, #03041a, #0d0a35);
    }
    :host-context([data-theme='light']) canvas {
      background: linear-gradient(180deg, #eeeafc, #e3ddfb);
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
    // Decorative backdrop: 1× pixel density is plenty and quarters the work on retina.
    let fitted = fitCanvas(canvas, 1);
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
    let slowFrames = 0;
    const loop: AnimationLoop | null = this.prefs.reducedMotion()
      ? null
      : new AnimationLoop(
          canvas,
          ({ dt }) => {
            const started = performance.now();
            draw(dt);
            slowFrames = performance.now() - started > 32 ? slowFrames + 1 : 0;
            // Keep the last frame on busy/slow devices instead of monopolizing
            // the main thread. Resize and theme changes can still redraw it.
            if (slowFrames >= 3) {
              loop?.destroy();
              canvas.setAttribute('data-animation-state', 'paused-for-performance');
            }
          },
          30, // ambient motion: 30 fps looks the same and halves the cost
        );

    const onMove = (e: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - box.left) / box.width - 0.5;
      mouse.y = (e.clientY - box.top) / box.height - 0.5;
    };
    const resize = new ResizeObserver(() => {
      fitted = fitCanvas(canvas, 1);
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
