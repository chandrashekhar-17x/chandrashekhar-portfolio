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
import { REPO_URL } from '../../core/devtools/console-api';
import { BUILD_INFO } from '../../core/seo/site-origin.gen';
import { hyderabadNow } from '../../core/time/local-status';
import { timeAgo } from '../../core/time/time-ago';

@Component({
  selector: 'app-site-footer',
  template: `
    <footer class="foot">
      <div class="made">
        <span
          >© {{ year }} {{ profile()?.name }} · Built with Angular, FastAPI &amp; a lot of
          curiosity</span
        >
        @if (build; as b) {
          <a class="mono stamp" [href]="commitUrl" target="_blank" rel="noopener"
            >updated {{ updated() }} · {{ b.sha.slice(0, 7) }}
            @if (b.subject) {
              · {{ b.subject }}
            }
            ↗</a
          >
        }
      </div>
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
    .made {
      display: grid;
      gap: 4px;
      min-width: 0;
    }
    .stamp {
      overflow: hidden;
      color: var(--ink-3);
      font-size: 11.5px;
      text-decoration: none;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .stamp:hover,
    .stamp:focus-visible {
      color: var(--ink);
      text-decoration: underline;
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
  /** The commit this build came from: the site is built in public. */
  protected readonly build = BUILD_INFO;
  protected readonly commitUrl = `${REPO_URL}/commit/${BUILD_INFO?.sha ?? ''}`;
  /** Server HTML shows the date; the browser swaps in "3 h ago" after hydration. */
  protected readonly updated = signal(BUILD_INFO?.date?.slice(0, 10) ?? '');
  /** Browser only (set after hydration), so the server HTML never has a stale time. */
  protected readonly now = signal<ReturnType<typeof hyderabadNow> | null>(null);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const tick = () => {
        const now = new Date();
        this.now.set(hyderabadNow(now));
        if (BUILD_INFO?.date) this.updated.set(timeAgo(new Date(BUILD_INFO.date), now));
      };
      tick();
      const id = setInterval(tick, 30_000);
      destroyRef.onDestroy(() => {
        clearInterval(id);
      });
    });
  }
}
