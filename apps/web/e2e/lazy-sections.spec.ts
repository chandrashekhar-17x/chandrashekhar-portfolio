import { expect, test } from '@playwright/test';

// Home sections are skeleton-first: the server sends placeholders, the browser
// loads each section's code on scroll and reveals them one at a time.

test('server HTML has skeletons for lazy sections, not their content', async ({ page }) => {
  await page.route(/\.js$/, (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('#graph app-section-skeleton')).toBeVisible();
  await expect(page.locator('#graph app-graph-explorer')).toHaveCount(0);
});

test('scrolling through the page causes almost no layout shift (CLS < 0.05)', async ({ page }) => {
  // Record layout shifts from the very start of the page load.
  await page.addInitScript(() => {
    const w = window as Window & { __cls?: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        if (!e.hadRecentInput) w.__cls = (w.__cls ?? 0) + e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto('/');

  // Scroll down in steps like a reader, letting each section load and reveal.
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 400) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(250);
  }
  await expect(page.locator('#graph app-graph-explorer')).toBeVisible();
  await page.waitForTimeout(800);

  const cls = await page.evaluate(() => (window as Window & { __cls?: number }).__cls ?? 0);
  expect(cls).toBeLessThan(0.05);
});
