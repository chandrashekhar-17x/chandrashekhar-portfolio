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
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Knowledge graph' })
    .click();

  // Smooth scrolling: we should catch it part-way, not only at the end.
  const positions: number[] = [];
  for (let i = 0; i < 12; i++) {
    positions.push(await page.evaluate(() => scrollY));
    await page.waitForTimeout(40);
  }
  const target = Math.max(...positions);
  expect(positions.some((y) => y > 0 && y < target)).toBe(true);

  await expect
    .poll(() => page.locator('#graph').evaluate((e) => Math.round(e.getBoundingClientRect().top)))
    .toBe(
      await page
        .locator('app-site-nav')
        .evaluate((e) => Math.round(e.getBoundingClientRect().height)),
    );
});
