import { expect, test } from '@playwright/test';

test('hero + stats fill the first screen; the next section starts below the fold', async ({
  page,
}) => {
  await page.goto('/');
  const viewport = await page.evaluate(() => innerHeight);
  const graphTop = await page.locator('#graph').evaluate((e) => e.getBoundingClientRect().top);
  // Never peeks in; on very short screens the hero keeps its minimum height instead.
  expect(graphTop).toBeGreaterThanOrEqual(viewport - 1);
});

test('nav links glide to their section and stop just below the sticky nav', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'section links live in the mobile menu (covered in nav.spec)');
  await page.goto('/');
  // Sample inside the browser before the click: Node-side polling can miss the
  // entire animation while a busy runner waits for a protocol response.
  await page.evaluate(() => {
    const w = window as Window & { __navScrollPositions?: number[] };
    w.__navScrollPositions = [];
    let frames = 0;
    const sample = () => {
      w.__navScrollPositions?.push(scrollY);
      if (++frames < 120) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Knowledge graph' })
    .click();

  await expect
    .poll(() => page.locator('#graph').evaluate((e) => Math.round(e.getBoundingClientRect().top)))
    .toBe(
      await page
        .locator('app-site-nav')
        .evaluate((e) => Math.round(e.getBoundingClientRect().height)),
    );
  const positions = await page.evaluate(
    () => (window as Window & { __navScrollPositions?: number[] }).__navScrollPositions ?? [],
  );
  const target = Math.max(...positions);
  expect(positions.some((y) => y > 0 && y < target)).toBe(true);
});
