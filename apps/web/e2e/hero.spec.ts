import { expect, test } from '@playwright/test';

test.describe('hero', () => {
  test('server HTML already contains the hero and stats (no JS needed)', async ({ page }) => {
    await page.route(/\.js$/, (route) => route.abort());
    await page.goto('/');
    await expect(
      page.getByText(/Software Engineer, Frontend \(Angular\) · Hyderabad, India/),
    ).toBeVisible();
    await expect(page.getByText('years of experience', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /building a CAD editor from zero/ })).toBeVisible();
  });

  test('typed line cycles through phrases', async ({ page }) => {
    await page.goto('/');
    const typed = page.locator('app-typewriter b');
    await expect(typed).toHaveText('custom CAD editors in Three.js', { timeout: 5000 });
    await expect(typed).toHaveText(/^DXF/, { timeout: 8000 });
  });

  test('canvas animates, and stays still with reduced motion', async ({ page }) => {
    const frame = () =>
      page.locator('app-hero-canvas canvas').evaluate((c: HTMLCanvasElement) => c.toDataURL());

    await page.goto('/');
    const a = await frame();
    await page.waitForTimeout(400);
    expect(await frame()).not.toBe(a);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    const b = await frame();
    await page.waitForTimeout(400);
    expect(await frame()).toBe(b);
  });

  test('stats count up to their final value', async ({ page }) => {
    await page.goto('/');
    const dxf = page.locator('app-stats-strip div', { hasText: 'DXF entity types' }).locator('dd');
    await expect(dxf).toHaveText('8', { timeout: 3000 });
    const years = page.locator('app-stats-strip div', { hasText: 'years of experience' });
    await expect(years.locator('dd')).toHaveText(/^\d+\+$/);
  });
});
