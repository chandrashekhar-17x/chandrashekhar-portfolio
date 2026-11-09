import { expect, test } from '@playwright/test';

test.describe('hero', () => {
  test('server HTML already contains the hero and stats (no JS needed)', async ({ page }) => {
    await page.route(/\.js$/, (route) => route.abort());
    await page.goto('/');
    await expect(page.getByText(/Open to frontend/)).toBeVisible();
    await expect(page.getByText('Skills in the knowledge graph')).toBeVisible();
  });

  test('typed line cycles through phrases', async ({ page }) => {
    await page.goto('/');
    const typed = page.locator('app-typewriter b');
    await expect(typed).toHaveText('Angular apps that scale', { timeout: 5000 });
    await expect(typed).toHaveText(/^CAD/, { timeout: 8000 });
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
    await expect(page.getByText('30+', { exact: true })).toBeVisible({ timeout: 3000 });
  });
});
