import { expect, test } from '@playwright/test';

test('Ctrl+K / ⌘K opens the palette; typing + Enter navigates; Esc closes', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'keyboard shortcut is a desktop feature (mobile uses the menu)');
  await page.goto('/');
  await expect(page.locator('app-command-palette')).toBeAttached(); // loaded on idle
  await page.keyboard.press('Control+k');
  const input = page.getByRole('combobox', { name: /Jump to/ });
  await expect(input).toBeFocused();

  await input.fill('resume');
  await expect(page.getByRole('option').first()).toHaveText(/Resume/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/resume$/);

  await page.keyboard.press('Control+k');
  await expect(input).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(input).toBeHidden();
});

test('mobile menu offers the agent and the command palette', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Search & commands' }).click();
  await expect(page.getByRole('combobox', { name: /Jump to/ })).toBeVisible();
});
