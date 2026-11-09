import { expect, test } from '@playwright/test';

test('home work cards fill in one by one, then link to case studies', async ({ page }) => {
  await page.goto('/');
  await page.locator('#work').scrollIntoViewIfNeeded();
  const cards = page.locator('#work app-project-card .card');
  await expect(cards.first()).toBeVisible();

  // Record when each card finishes loading: they must finish in order, not all at once.
  const finished = await page.evaluate(async () => {
    const els = [...document.querySelectorAll('#work app-project-card .card')];
    const times: number[] = els.map(() => 0);
    const start = performance.now();
    while (times.some((t) => t === 0) && performance.now() - start < 8000) {
      els.forEach((el, i) => {
        if (!times[i] && !el.classList.contains('is-loading')) times[i] = performance.now() - start;
      });
      await new Promise((r) => setTimeout(r, 20));
    }
    return times;
  });
  expect(finished.length).toBeGreaterThan(1);
  for (let i = 1; i < finished.length; i++) {
    expect(finished[i]).toBeGreaterThan(finished[i - 1] ?? 0);
  }

  await page.getByRole('link', { name: 'Canvas CAD Editor' }).click();
  await expect(page).toHaveURL(/\/work\/cad-editor$/);
});

test('/work renders every card on the server (no skeletons, works without JS)', async ({
  page,
}) => {
  await page.route(/\.js$/, (route) => route.abort());
  await page.goto('/work');
  await expect(page.locator('app-project-card')).toHaveCount(4);
  await expect(page.locator('.card.is-loading')).toHaveCount(0);
});
