import { expect, test } from '@playwright/test';

test('experience: 3 roles under 2 companies, newest first, plus education', async ({ page }) => {
  await page.goto('/');
  await page.locator('#xp').scrollIntoViewIfNeeded();
  const companies = page.locator('#xp li.company');
  await expect(companies).toHaveCount(2, { timeout: 10_000 });
  await expect(companies.locator('h3')).toHaveText(['VassarDigital.ai', 'Vassar Labs']);
  await expect(companies.nth(0).locator('li.role')).toHaveCount(1);
  await expect(companies.nth(1).locator('li.role')).toHaveCount(2);
  await expect(companies.nth(0)).toContainText('Present');
  await expect(page.locator('#xp app-education-card')).toContainText('(NIT) Jamshedpur');
  await expect(page.locator('#xp app-education-card')).toContainText('2020 – 2023');
});
