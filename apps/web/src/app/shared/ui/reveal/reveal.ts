import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  afterNextRender,
  contentChild,
  inject,
  input,
  signal,
} from '@angular/core';

import { RevealQueue } from '../../../core/reveal/reveal-queue.service';
import { RevealTimeline } from '../../../core/reveal/reveal-timeline.service';
import { SectionSkeleton, SkeletonKind } from '../section-skeleton/section-skeleton';

/**
 * Wraps a lazy home section's content:
 * 1. shows the same-size skeleton (loading),
 * 2. waits for its turn in the RevealQueue (one section at a time),
 * 3. renders the content, then on the next frame adds .is-revealed so the
 *    .reveal-item children animate in with a stagger.
 *
 * Usage: <app-reveal kind="graph" label="knowledge graph"><ng-template>…</ng-template></app-reveal>
 */
@Component({
  selector: 'app-reveal',
  imports: [NgTemplateOutlet, SectionSkeleton],
  template: `
    @if (mounted()) {
      <div [class.is-revealed]="shown()">
        <ng-container [ngTemplateOutlet]="content()" />
      </div>
    } @else {
      <app-section-skeleton [kind]="kind()" [label]="label()" [count]="count()" [loading]="true" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reveal {
  readonly kind = input.required<SkeletonKind>();
  readonly label = input.required<string>();
  readonly count = input(3);

  protected readonly content = contentChild.required(TemplateRef);
  protected readonly mounted = signal(false);
  protected readonly shown = signal(false);

  constructor() {
    const queue = inject(RevealQueue);
    const timeline = inject(RevealTimeline);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      void queue.enqueue(() => {
        this.mounted.set(true);
        timeline.record(host.closest('section')?.id ?? '');
        requestAnimationFrame(() => {
          this.shown.set(true);
        });
      });
    });
  }
}
