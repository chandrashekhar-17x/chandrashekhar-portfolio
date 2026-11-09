import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContentRepository } from '../../core/content/content-repository';

@Component({
  selector: 'app-site-footer',
  template: `
    <footer class="foot">
      <span
        >© {{ year }} {{ profile()?.name }} · Built with Angular, FastAPI &amp; a lot of
        curiosity</span
      >
      <span class="mono">/llms.txt · MCP server (coming soon)</span>
    </footer>
  `,
  styles: `
    .foot {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      padding: 28px;
      border-top: 1px solid var(--line);
      color: var(--ink-3);
      font-size: 12.5px;
    }
    .mono {
      font-family: var(--font-mono);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
  protected readonly profile = toSignal(inject(ContentRepository).profile());
}
