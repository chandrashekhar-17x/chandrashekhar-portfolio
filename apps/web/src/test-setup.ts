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

/** Adds a no-op DOM method that jsdom doesn't implement (real browsers have them). */
function stubMethod(proto: object, name: string): void {
  if (!(name in proto)) {
    Object.defineProperty(proto, name, {
      value: () => undefined,
      configurable: true,
      writable: true,
    });
  }
}

// No layout in jsdom: nothing to scroll.
stubMethod(Element.prototype, 'scrollIntoView');

// <dialog>: showModal/close just toggle the "open" attribute.
for (const [name, open] of [
  ['showModal', true],
  ['close', false],
] as const) {
  if (!(name in HTMLDialogElement.prototype)) {
    Object.defineProperty(HTMLDialogElement.prototype, name, {
      configurable: true,
      writable: true,
      value(this: HTMLDialogElement) {
        if (open) this.setAttribute('open', '');
        else this.removeAttribute('open');
      },
    });
  }
}
