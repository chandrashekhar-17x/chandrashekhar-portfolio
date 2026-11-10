import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonKind = 'featured' | 'graph' | 'work' | 'lab' | 'xp' | 'contact';

/**
 * Same-size placeholder for a lazy home section (prototype: .sk-sec).
 * Shapes mirror the real layout so nothing jumps when content arrives.
 * `loading` = the section's code is downloading (shimmer + progress bar).
 */
@Component({
  selector: 'app-section-skeleton',
  templateUrl: './section-skeleton.html',
  styleUrl: './section-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'status',
    '[attr.aria-busy]': 'true',
    '[attr.aria-label]': '"Loading " + label()',
    '[class.is-loading]': 'loading()',
    '[class]': '"kind-" + kind()',
  },
})
export class SectionSkeleton {
  readonly kind = input.required<SkeletonKind>();
  readonly label = input.required<string>();
  readonly loading = input(false);
  /** Number of repeated cards / rows for list-like sections. */
  readonly count = input(3);

  protected items(): number[] {
    return Array.from({ length: this.count() }, (_, i) => i);
  }
}
