import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { AnimationLoop } from '../../core/motion/animation-loop';
import { cssVar, fitCanvas, FittedCanvas } from '../../core/motion/canvas';
import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { seededRandom } from '../../core/motion/seeded-random';
import { ThemeService } from '../../core/theme/theme.service';
import { createParticles, drawOrb } from './core-orb-scene';

/** Canvas wrapper for the AI core orb. `speaking` pulses it (decays on its own). */
@Component({
  selector: 'app-core-orb',
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
  styles: `
    :host {
      display: block;
      height: 300px;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoreOrb {
  /** Bump this number to make the orb pulse (e.g. when the mic is pressed). */
  readonly pulse = input(0);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly prefs = inject(MediaPrefs);
  private readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);
  private colors = { front: '', back: '' };
  private redraw?: () => void;

  constructor() {
    afterNextRender(() => {
      this.start();
    });
    // Read theme colours once per theme change (not every frame), then repaint.
    effect(() => {
      this.theme.theme();
      if (!this.redraw) return; // not started yet (or server)
      this.colors = { front: cssVar('--cyan'), back: cssVar('--violet') };
      this.redraw();
    });
  }

  private start(): void {
    const canvas = this.canvas().nativeElement;
    const particles = createParticles(260, seededRandom(3));
    const still = this.prefs.reducedMotion();
    let fitted: FittedCanvas | null = fitCanvas(canvas, 1.5);
    let speaking = 0;
    let lastPulse = this.pulse();

    const draw = (time: number) => {
      if (!fitted) return;
      if (this.pulse() !== lastPulse) {
        lastPulse = this.pulse();
        speaking = 1;
      }
      speaking *= 0.985;
      drawOrb(fitted.ctx, particles, {
        width: fitted.width,
        height: fitted.height,
        t: still ? 0 : time / 1000,
        speaking: still ? 0 : speaking,
        front: this.colors.front,
        back: this.colors.back,
      });
    };

    this.colors = { front: cssVar('--cyan'), back: cssVar('--violet') };
    this.redraw = () => {
      draw(0);
    };
    const loop = still
      ? null
      : new AnimationLoop(
          canvas,
          ({ time }) => {
            draw(time);
          },
          30, // ambient rotation: 30 fps is plenty
        );
    draw(0);
    const resize = new ResizeObserver(() => {
      fitted = fitCanvas(canvas, 1.5);
      draw(0);
    });
    resize.observe(canvas);
    this.destroyRef.onDestroy(() => {
      loop?.destroy();
      resize.disconnect();
    });
  }
}
