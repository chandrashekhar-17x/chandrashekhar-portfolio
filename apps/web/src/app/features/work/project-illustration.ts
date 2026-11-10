import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { Project } from '../../core/content/content.types.gen';

export type Illustration = NonNullable<Project['illustration']>;

type Drawing = 'cad' | 'pdf' | 'table' | 'rag' | 'voice' | 'api';
const DRAWING: Record<Illustration, Drawing> = {
  cad: 'cad',
  signalling: 'cad',
  playground: 'cad',
  'doc-highlight': 'pdf',
  'pdf-stream': 'pdf',
  'knowledge-base': 'table',
  bbox: 'table',
  architecture: 'table',
  sse: 'api',
  rag: 'rag',
  voice: 'voice',
};

/** Six small schematic SVGs (prototype projSvg), drawn with theme tokens. */
@Component({
  selector: 'app-project-illustration',
  templateUrl: './project-illustration.html',
  styles: `
    :host,
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    :host {
      background: var(--bg-2); // fills the letterbox when fit = contain
    }
  `,
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectIllustration {
  readonly kind = input<Illustration>('architecture');
  /** cover = fill and crop (cards); contain = fit inside (wide banners). */
  readonly fit = input<'cover' | 'contain'>('cover');

  /** Which drawing to show. The next UI PR gives every kind its own drawing. */
  protected readonly drawing = computed(() => DRAWING[this.kind()]);

  /** Pre-computed shapes (keeps the template free of maths). */
  protected readonly pages = [0, 1, 2];
  protected readonly lines = [0, 1, 2, 3, 4, 5, 6];
  protected readonly rows = Array.from({ length: 8 }, (_, r) => r);
  protected readonly cols = Array.from({ length: 5 }, (_, c) => c);
  protected readonly corners: [number, number][] = [
    [60, 35],
    [170, 35],
    [60, 105],
    [170, 105],
  ];
  protected readonly endpoints: [number, number][] = [
    [40, 30],
    [260, 30],
    [40, 120],
    [260, 120],
    [150, 15],
  ];
  protected readonly dots = Array.from({ length: 14 }, (_, i) => ({
    x: 30 + ((i * 53) % 240),
    y: 20 + ((i * 37) % 110),
    r: 3 + (i % 4),
    color: ['var(--cyan)', 'var(--violet)', 'var(--pink)'][i % 3] ?? 'var(--cyan)',
  }));
  protected readonly bars = Array.from({ length: 40 }, (_, i) => {
    const h = 8 + Math.abs(Math.sin(i * 0.6)) * 50 * Math.sin((i / 40) * Math.PI);
    return { x: 30 + i * 6, y: 75 - h / 2, h, color: i % 2 ? 'var(--cyan)' : 'var(--violet)' };
  });
}
