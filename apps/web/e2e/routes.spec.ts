import { expect, test } from '@playwright/test';

// Every route renders on the server with the right status code and one <h1>.
const ROUTES = ['/', '/work', '/work/cad-editor', '/lab', '/graph', '/journal', '/resume'];

for (const path of ROUTES) {
  test(`${path} renders with status 200 and a single h1`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
  });
}

for (const path of ['/nope', '/work/nope']) {
  test(`${path} answers 404 with a helpful page`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toBeVisible();
  });
}

test('the work list links to each case study', async ({ page }) => {
  await page.goto('/work');
  await page.getByRole('link', { name: 'Canvas CAD Editor' }).click();
  await expect(page).toHaveURL(/\/work\/cad-editor$/);
  await expect(page.getByRole('heading', { level: 2, name: 'Problem' })).toBeVisible();
});
