import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Project } from '../../core/content/content.types.gen';

export type Illustration = Project['illustration'];

let nextId = 0;

/**
 * One small schematic SVG per illustration kind (recreated art, never employer
 * screenshots), drawn with theme tokens so it follows dark/light.
 */
@Component({
  selector: 'app-project-illustration',
  templateUrl: './project-illustration.html',
  styleUrl: './project-illustration.scss',
  host: { 'aria-hidden': 'true' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectIllustration {
  readonly kind = input<Illustration>('architecture');
  /** cover = fill and crop (cards); contain = fit inside (wide banners). */
  readonly fit = input<'cover' | 'contain'>('cover');

  /** SVG ids must be unique on the page: many cards share it. */
  protected readonly gridId = `ill-grid-${String(nextId++)}`;

  // Pre-computed shapes (keeps the template free of maths).
  protected readonly pages = [0, 1, 2];
  protected readonly lines = [0, 1, 2, 3, 4, 5, 6];
  protected readonly corners: [number, number][] = [
    [60, 35],
    [170, 35],
    [60, 105],
    [170, 105],
  ];
  protected readonly sleepers = Array.from({ length: 24 }, (_, i) => 14 + i * 12);
  protected readonly signals = [
    { x: 70, on: 'var(--lime)' },
    { x: 150, on: 'var(--rose)' },
    { x: 230, on: 'var(--lime)' },
  ];
  protected readonly tiles = [
    { x: 40, label: 'URL' },
    { x: 105, label: 'PDF' },
    { x: 170, label: 'ZIP' },
  ];
  protected readonly blocks = [
    { x: 40, y: 40, w: 100, h: 10 },
    { x: 40, y: 58, w: 140, h: 6 },
    { x: 40, y: 70, w: 120, h: 6 },
    { x: 190, y: 40, w: 70, h: 50 },
    { x: 40, y: 98, w: 220, h: 6 },
    { x: 40, y: 110, w: 180, h: 6 },
  ];
  protected readonly spans = [
    { y: 34, w: 150, mark: '' },
    { y: 46, w: 170, mark: 'var(--amber)', mx: 60, mw: 70 },
    { y: 58, w: 140, mark: '' },
    { y: 70, w: 160, mark: 'var(--cyan)', mx: 20, mw: 90 },
    { y: 82, w: 120, mark: '' },
    { y: 94, w: 165, mark: '' },
    { y: 106, w: 110, mark: 'var(--amber)', mx: 30, mw: 50 },
  ];
  protected readonly events = [
    { y: 30, name: 'queued', w: 20 },
    { y: 56, name: 'parsing', w: 55 },
    { y: 82, name: 'progress', w: 75 },
    { y: 108, name: 'done', w: 110 },
  ];
  protected readonly tree = {
    leaves: [62, 118, 182, 238],
    mids: [90, 210],
  };
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
