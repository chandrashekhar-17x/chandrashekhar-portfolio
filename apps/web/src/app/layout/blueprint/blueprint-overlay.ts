import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { BlueprintService } from '../../core/blueprint/blueprint.service';
import { RevealTimeline, revealNote } from '../../core/reveal/reveal-timeline.service';
import { Box, dimensions } from './dimensions';

/** What gets dimensioned: home sections (plus the hero), or the page's <main>. */
function measure(timeline: RevealTimeline): Box[] {
  const els = [...document.querySelectorAll<HTMLElement>('.first-screen, main section[id]')];
  const targets = els.length ? els : [...document.querySelectorAll<HTMLElement>('main')];
  return targets.map((el) => {
    const r = el.getBoundingClientRect();
    const id = el.id || (el.classList.contains('first-screen') ? 'hero' : 'main');
    return {
      id,
      note: revealNote(timeline.get(id)),
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    };
  });
}

/**
 * The blueprint drawing layer: dimension lines on every section, a CAD crosshair
 * with page coordinates, and a title block. Re-measures on scroll/resize (one rAF).
 */
@Component({
  selector: 'app-blueprint-overlay',
  templateUrl: './blueprint-overlay.html',
  styleUrl: './blueprint-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'schedule()',
    '(window:resize)': 'schedule()',
    '(document:pointermove)': 'onMove($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class BlueprintOverlay {
  private readonly blueprint = inject(BlueprintService);
  private readonly timeline = inject(RevealTimeline);
  private readonly boxes = signal<Box[]>([]);
  protected readonly vw = signal(0);
  protected readonly vh = signal(0);
  private readonly navBottom = signal(0);
  protected readonly dpr = signal(1);
  protected readonly pointer = signal<{ x: number; y: number; scrollY: number } | null>(null);
  protected readonly dims = computed(() =>
    dimensions(this.boxes(), this.vw(), this.vh(), this.navBottom()),
  );
  protected readonly route = toSignal(
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: inject(Router).url },
  );
  protected readonly date = new Date().toISOString().slice(0, 10);

  private readonly destroyRef = inject(DestroyRef);
  private frame = 0;
  private fine = false;

  constructor() {
    afterNextRender(() => {
      this.fine = matchMedia('(pointer: fine)').matches;
      this.update();
      // Deferred sections reveal (and grow) after we start: watch <main>'s size.
      const ro = new ResizeObserver(() => {
        this.schedule();
      });
      const main = document.querySelector('main');
      if (main) ro.observe(main);
      this.destroyRef.onDestroy(() => {
        ro.disconnect();
        cancelAnimationFrame(this.frame);
      });
    });
  }

  /** Label box width for a value (the SVG has no text measuring). */
  protected labelWidth(text: string): number {
    return text.length * 8 + 14;
  }

  protected schedule(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  }

  protected onMove(event: PointerEvent): void {
    if (!this.fine) return;
    this.pointer.set({ x: event.clientX, y: event.clientY, scrollY: window.scrollY });
  }

  protected close(): void {
    this.blueprint.set(false);
  }

  private update(): void {
    this.vw.set(window.innerWidth);
    this.vh.set(window.innerHeight);
    this.dpr.set(Math.round((window.devicePixelRatio || 1) * 100) / 100);
    this.boxes.set(measure(this.timeline));
    this.navBottom.set(document.querySelector('app-site-nav')?.getBoundingClientRect().bottom ?? 0);
    const p = this.pointer();
    if (p) this.pointer.set({ ...p, scrollY: window.scrollY });
  }
}
