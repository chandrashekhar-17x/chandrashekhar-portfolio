import { expect, test } from '@playwright/test';

test.describe('arrow cursor', () => {
  test('desktop mouse: arrow cursor with context labels', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pointer effects are for mouse users');
    await page.goto('/');
    await expect(page.locator('app-cursor')).toBeAttached({ timeout: 5000 });
    await expect(page.locator('html')).toHaveClass(/custom-cursor/);

    await page.locator('app-hero-section .btn--primary').hover();
    await expect(page.locator('app-cursor .label')).toHaveText('click');
  });

  test('reduced motion: no custom cursor, native cursor kept', async ({ page, isMobile }) => {
    test.skip(isMobile, 'covered by the touch test');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('app-chat-widget')).toBeAttached({ timeout: 5000 }); // deferred block loaded
    await expect(page.locator('app-cursor')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/custom-cursor/);
  });

  test('touch devices: no custom cursor', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch only');
    await page.goto('/');
    await expect(page.locator('app-chat-widget')).toBeAttached({ timeout: 5000 });
    await expect(page.locator('app-cursor')).toHaveCount(0);
  });
});
