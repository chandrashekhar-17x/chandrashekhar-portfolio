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
    const paused = await page
      .locator('app-hero-canvas canvas')
      .getAttribute('data-animation-state');
    if (paused !== 'paused-for-performance') expect(await frame()).not.toBe(a);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    const b = await frame();
    await page.waitForTimeout(400);
    expect(await frame()).toBe(b);
  });

  test('slow decorative canvas frames pause while the page remains usable', async ({ page }) => {
    await page.addInitScript(() => {
      const proto = CanvasRenderingContext2D.prototype;
      type Clear = (this: CanvasRenderingContext2D, ...box: number[]) => void;
      const clear = Object.getOwnPropertyDescriptor(proto, 'clearRect')?.value as Clear;
      proto.clearRect = function (this: CanvasRenderingContext2D, x, y, w, h) {
        const started = performance.now();
        while (performance.now() - started < 40) {
          /* emulate a slow canvas device */
        }
        clear.call(this, x, y, w, h);
      };
    });
    await page.goto('/');
    const canvas = page.locator('app-hero-canvas canvas');
    await expect(canvas).toHaveAttribute('data-animation-state', 'paused-for-performance');
    const frame = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await page.waitForTimeout(200);
    expect(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(frame);
    await page
      .locator('app-hero-section')
      .getByRole('button', { name: /Talk to my AI agent/ })
      .click();
    await expect(page.getByRole('dialog', { name: 'Talk to My Agent.' })).toBeVisible();
  });

  test('stats count up to their final value', async ({ page }) => {
    await page.goto('/');
    const dxf = page.locator('app-stats-strip div', { hasText: 'DXF entity types' }).locator('dd');
    await expect(dxf).toHaveText('8', { timeout: 3000 });
    const years = page.locator('app-stats-strip div', { hasText: 'years of experience' });
    await expect(years.locator('dd')).toHaveText(/^\d+\+$/);
  });
});
