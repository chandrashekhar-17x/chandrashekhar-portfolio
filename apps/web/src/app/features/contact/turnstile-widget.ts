import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(id: string): void;
  remove(id: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<TurnstileApi> | undefined;

/** Load Cloudflare's script once per page, only when a form actually needs it. */
function loadTurnstile(): Promise<TurnstileApi> {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('turnstile missing'));
    };
    s.onerror = () => {
      loading = undefined;
      reject(new Error('turnstile failed to load'));
    };
    document.head.append(s);
  });
  return loading;
}

/**
 * Cloudflare Turnstile bot check (usually invisible to people). Emits a one-time
 * token the API verifies; `null` when the token expires. Browser only.
 */
@Component({
  selector: 'app-turnstile',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'turnstile' },
})
export class TurnstileWidget {
  readonly siteKey = input.required<string>();
  readonly token = output<string | null>();

  private widgetId?: string;
  private api?: TurnstileApi;

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      void loadTurnstile()
        .then((api) => {
          this.api = api;
          this.widgetId = api.render(host, {
            sitekey: this.siteKey(),
            theme: 'auto',
            size: 'flexible',
            callback: (t: string) => {
              this.token.emit(t);
            },
            'expired-callback': () => {
              this.token.emit(null);
            },
            'error-callback': () => {
              this.token.emit(null);
            },
          });
        })
        .catch(() => {
          this.token.emit(null);
        });
    });
    inject(DestroyRef).onDestroy(() => {
      if (this.widgetId) this.api?.remove(this.widgetId);
    });
  }

  /** Tokens are single-use: get a fresh one after each send. */
  reset(): void {
    if (this.widgetId) this.api?.reset(this.widgetId);
    this.token.emit(null);
  }
}
