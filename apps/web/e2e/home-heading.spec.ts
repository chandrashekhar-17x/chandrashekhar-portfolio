import { expect, test } from '@playwright/test';

// Regression: the name in the home <h1> used to break mid-word on small screens.
// The name is one word, so it must always render on exactly one line and fit.
const WIDTHS = [320, 390, 1440] as const;

interface HeadingLayout {
  lines: number;
  overflowsHeading: boolean;
  headingRight: number;
  pageScrollsSideways: boolean;
}

for (const width of WIDTHS) {
  test(`home heading stays on one line at ${String(width)}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const layout = await page.locator('h1').evaluate((h1): HeadingLayout => {
      // Each line of text produces its own rect; count distinct line tops.
      const range = document.createRange();
      range.selectNodeContents(h1);
      const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
      const root = document.documentElement;
      return {
        lines: tops.size,
        overflowsHeading: h1.scrollWidth > h1.clientWidth,
        headingRight: h1.getBoundingClientRect().right,
        pageScrollsSideways: root.scrollWidth > root.clientWidth,
      };
    });

    expect(layout.lines, 'name wraps onto more than one line').toBe(1);
    expect(layout.overflowsHeading, 'text overflows the heading box').toBe(false);
    expect(layout.headingRight).toBeLessThanOrEqual(width);
    expect(layout.pageScrollsSideways, 'page scrolls horizontally').toBe(false);
  });
}
