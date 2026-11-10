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

// Path2D: canvas code batches shapes into paths; jsdom has no canvas, so record the
// number of sub-shapes added (tests count them).
if (!('Path2D' in globalThis)) {
  class FakePath2D {
    shapes = 0;
    moveTo(): void {
      // positions are irrelevant in tests
    }
    lineTo(): void {
      this.shapes++;
    }
    arc(): void {
      this.shapes++;
    }
  }
  Object.defineProperty(globalThis, 'Path2D', { value: FakePath2D, configurable: true });
}

// IntersectionObserver: nothing is ever "on screen" in jsdom; observers simply never fire.
if (!('IntersectionObserver' in globalThis)) {
  class FakeIntersectionObserver {
    observe(): void {
      // never intersects in jsdom
    }
    unobserve(): void {
      // nothing to stop
    }
    disconnect(): void {
      // nothing to stop
    }
    takeRecords(): [] {
      return [];
    }
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    value: FakeIntersectionObserver,
    configurable: true,
  });
}

// document.fonts: fonts are "ready" immediately in jsdom.
if (!('fonts' in document)) {
  Object.defineProperty(document, 'fonts', {
    value: { ready: Promise.resolve() },
    configurable: true,
  });
}

// ResizeObserver: jsdom has no layout, so sizes never change.
if (!('ResizeObserver' in globalThis)) {
  class FakeResizeObserver {
    observe(): void {
      // no layout in jsdom
    }
    unobserve(): void {
      // nothing to stop
    }
    disconnect(): void {
      // nothing to stop
    }
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: FakeResizeObserver,
    configurable: true,
  });
}
