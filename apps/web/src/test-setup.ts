// Global setup for unit tests (jsdom). Adds browser APIs jsdom doesn't implement.

// matchMedia: report "no match" for every query (no reduced motion, no fine pointer).
// Individual tests override MediaPrefs when they need a specific preference.
if (typeof window.matchMedia !== 'function') {
  // Test stub: only the members our code uses (deprecated addListener omitted).
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
