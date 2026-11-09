import { TestBed } from '@angular/core/testing';

import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('starts dark when the page has no theme attribute', () => {
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
  });

  it('picks up light when the inline script already applied it', () => {
    document.documentElement.setAttribute('data-theme', 'light');
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
  });

  it('toggles the attribute and remembers the choice', () => {
    const theme = TestBed.inject(ThemeService);

    theme.toggle();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');

    theme.toggle();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});
