import { graphemes } from '../../core/text/graphemes';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
} from '@angular/core';

interface Word {
  chars: { ch: string; delay: number }[];
}

/**
 * Hero <h1>: each letter rises in with a small stagger (prototype .ch / rise).
 * Letters are grouped per word in a no-wrap span, so a word can never break
 * across lines (inline-block letters alone would allow that).
 */
@Component({
  selector: 'app-hero-title',
  templateUrl: './hero-title.html',
  styleUrl: './hero-title.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroTitle {
  /** Read only by screen readers/search engines, before the visible title. */
  readonly name = input.required<string>();
  readonly text = input.required<string>();
  readonly highlight = input.required<string>();

  protected readonly lines = computed(() => {
    let i = 0;
    const split = (line: string): Word[] =>
      line
        .split(' ')
        .filter(Boolean)
        .map((word) => ({ chars: graphemes(word).map((ch) => ({ ch, delay: i++ * 28 })) }));
    return { plain: split(this.text()), grad: split(this.highlight()) };
  });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const measure = () => {
        alignGradient(host);
      };
      measure();
      void document.fonts.ready.then(measure); // widths change once the font loads
      const resize = new ResizeObserver(measure);
      resize.observe(host);
      destroyRef.onDestroy(() => {
        resize.disconnect();
      });
    });
  }
}

/** Gives each gradient letter its x offset (--x) and the line width (--w). */
export function alignGradient(root: HTMLElement): void {
  const line = root.querySelector<HTMLElement>('.grad');
  if (!line) return;
  line.style.setProperty('--w', `${String(line.offsetWidth)}px`);
  for (const ch of line.querySelectorAll<HTMLElement>('.ch')) {
    // offsetLeft ignores transforms, so the rise animation doesn't skew it.
    ch.style.setProperty('--x', `${String(ch.offsetLeft)}px`);
  }
}
