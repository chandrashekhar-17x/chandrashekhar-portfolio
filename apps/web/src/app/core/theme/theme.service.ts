import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'theme';
const THEME_COLOR: Record<Theme, string> = { dark: '#06071a', light: '#f5f4fb' };

/**
 * Dark/light theme as a signal.
 * The first paint is handled by a tiny inline script in index.html that reads the
 * saved theme before CSS loads (no flash). This service takes over after that.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly current = signal<Theme>(this.initial());

  readonly theme = this.current.asReadonly();

  toggle(): void {
    this.set(this.current() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this.current.set(theme);
    // getAttribute/setAttribute (not .dataset): the server-side DOM has no dataset.
    const root = this.doc.documentElement;
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme'); // dark is the default (no attribute)
    this.doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
    if (this.browser) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Private mode / storage disabled: the theme still works for this visit.
      }
    }
  }

  private initial(): Theme {
    return this.doc.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
}
