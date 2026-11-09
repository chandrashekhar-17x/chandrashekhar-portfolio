import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Eyebrow + h1 + lead paragraph used at the top of every inner page. */
@Component({
  selector: 'app-page-header',
  template: `
    <p class="eyebrow">{{ eyebrow() }}</p>
    <h1>{{ title() }}</h1>
    @if (lead()) {
      <p class="lead">{{ lead() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--space-7);
    }
    h1 {
      font-size: clamp(2rem, 6cqi, 3.5rem);
      letter-spacing: -0.035em;
      overflow-wrap: normal;
    }
    .lead {
      max-width: 60ch;
      margin-top: var(--space-3);
      color: var(--ink-2);
      font-size: var(--text-lg);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeader {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly lead = input<string>();
}
