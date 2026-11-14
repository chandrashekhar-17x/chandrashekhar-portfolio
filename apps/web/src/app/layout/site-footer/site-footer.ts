import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { BlueprintService } from '../../core/blueprint/blueprint.service';
import { ContentRepository } from '../../core/content/content-repository';
import { hyderabadNow } from '../../core/time/local-status';

@Component({
  selector: 'app-site-footer',
  template: `
    <footer class="foot">
      <span
        >© {{ year }} {{ profile()?.name }} · Built with Angular, FastAPI &amp; a lot of
        curiosity</span
      >
      @if (now(); as n) {
        <span class="mono now"
          ><span class="dot" aria-hidden="true"></span>Hyderabad {{ n.time }} IST · probably
          {{ n.status }}</span
        >
      }
      <button type="button" class="mono bp" (click)="blueprint.toggle()">
        ⌗ {{ blueprint.on() ? 'Exit blueprint' : 'View as blueprint' }}
      </button>
    </footer>
  `,
  styles: `
    .foot {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 10px 20px;
      // Right/bottom room for the floating chat button.
      padding: 28px 96px 28px 28px;
      border-top: 1px solid var(--line);
      color: var(--ink-3);
      font-size: 12.5px;
    }
    .mono {
      font-family: var(--font-mono);
    }
    .now {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--lime);
    }
    .bp {
      padding: 6px 10px;
      border: 1px dashed var(--line-2);
      border-radius: 6px;
      background: transparent;
      color: var(--ink-2);
      font-size: 12px;
      cursor: pointer;
      transition:
        border-color var(--dur-fast, 150ms),
        color var(--dur-fast, 150ms);
    }
    .bp:hover,
    .bp:focus-visible {
      border-color: var(--cyan);
      color: var(--ink);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
  protected readonly profile = toSignal(inject(ContentRepository).profile());
  protected readonly blueprint = inject(BlueprintService);
  /** Browser only (set after hydration), so the server HTML never has a stale time. */
  protected readonly now = signal<ReturnType<typeof hyderabadNow> | null>(null);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const tick = () => {
        this.now.set(hyderabadNow(new Date()));
      };
      tick();
      const id = setInterval(tick, 30_000);
      destroyRef.onDestroy(() => {
        clearInterval(id);
      });
    });
  }
}
