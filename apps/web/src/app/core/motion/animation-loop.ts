/**
 * requestAnimationFrame loop that only runs while it is useful:
 * paused when the element is off-screen or the browser tab is hidden.
 *
 * Browser-only: create it inside afterNextRender(). With zoneless Angular,
 * rAF callbacks never trigger change detection, so canvases cost nothing extra.
 */
export interface LoopFrame {
  /** Milliseconds since the loop was created. */
  time: number;
  /** Seconds since the previous frame (capped, so a resumed tab doesn't jump). */
  dt: number;
}

export class AnimationLoop {
  private rafId = 0;
  private onScreen = false;
  private running = false;
  private last = 0;
  private readonly start = performance.now();
  private readonly observer: IntersectionObserver;
  private readonly onVisibility = () => {
    this.update();
  };

  /** Minimum ms between frames (0 = every display frame). */
  private readonly minInterval: number;

  /**
   * @param maxFps cap for ambient effects (e.g. 30); omit for full refresh rate.
   */
  constructor(
    private readonly target: Element,
    private readonly frame: (f: LoopFrame) => void,
    maxFps?: number,
  ) {
    this.minInterval = maxFps ? 1000 / maxFps - 1 : 0;
    this.observer = new IntersectionObserver(([entry]) => {
      this.onScreen = entry?.isIntersecting ?? false;
      this.update();
    });
    this.observer.observe(target);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  /** Draw a single frame (used for reduced motion: show a still image). */
  renderOnce(): void {
    this.frame({ time: performance.now() - this.start, dt: 0 });
  }

  destroy(): void {
    this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.setRunning(false);
  }

  private update(): void {
    this.setRunning(this.onScreen && document.visibilityState === 'visible');
  }

  private setRunning(run: boolean): void {
    if (run === this.running) return;
    this.running = run;
    if (run) {
      this.last = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      cancelAnimationFrame(this.rafId);
    }
  }

  private readonly tick = (now: number) => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);
    const elapsed = now - this.last;
    if (elapsed < this.minInterval) return; // skip this display frame (fps cap)
    this.last = now;
    this.frame({ time: now - this.start, dt: Math.min(elapsed / 1000, 1 / 15) });
  };
}
