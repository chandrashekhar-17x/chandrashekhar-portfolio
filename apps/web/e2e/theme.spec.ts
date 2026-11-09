import { expect, test } from '@playwright/test';

test('theme toggle switches to light and survives a reload without flashing', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-theme');

  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');

  // The inline script must apply the theme before the app's code runs:
  // block all JS except the HTML document and check the attribute is already set.
  await page.route(/\.js$/, (route) => route.abort());
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'light');
});
