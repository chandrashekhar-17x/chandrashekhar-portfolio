import { expect, test } from '@playwright/test';

test('home work cards fill in one by one, then link to case studies', async ({ page }) => {
  await page.goto('/');
  // Start recording BEFORE scrolling, so no card can finish unobserved.
  // It waits for the cards to exist, then notes when each one stops loading.
  const recording = page.evaluate(async () => {
    const start = performance.now();
    let els: Element[] = [];
    while (!els.length && performance.now() - start < 8000) {
      els = [...document.querySelectorAll('#work app-project-card .card')];
      await new Promise((r) => setTimeout(r, 10));
    }
    const times: number[] = els.map(() => 0);
    while (times.some((t) => t === 0) && performance.now() - start < 10000) {
      els.forEach((el, i) => {
        if (!times[i] && !el.classList.contains('is-loading')) times[i] = performance.now() - start;
      });
      await new Promise((r) => setTimeout(r, 10));
    }
    return times;
  });
  await page.locator('#work').scrollIntoViewIfNeeded();
  const finished = await recording;
  expect(finished.length).toBeGreaterThan(1);
  for (let i = 1; i < finished.length; i++) {
    expect(finished[i]).toBeGreaterThan(finished[i - 1] ?? 0);
  }

  await page.getByRole('link', { name: 'Custom CAD Viewer & Editor, built from zero' }).click();
  await expect(page).toHaveURL(/\/work\/custom-cad-editor$/);
});

test('/work renders every card on the server (no skeletons, works without JS)', async ({
  page,
}) => {
  await page.route(/\.js$/, (route) => route.abort());
  await page.goto('/work');
  await expect(page.locator('app-project-card')).toHaveCount(11);
  await expect(page.locator('.card.is-loading')).toHaveCount(0);
});

for (const path of ['/', '/work']) {
  test(`all project cards on ${path} have the same width and height`, async ({ page }) => {
    await page.goto(path);
    if (path === '/') {
      await page.locator('#work').scrollIntoViewIfNeeded();
      // Wait for the cards to exist first, otherwise "0 loading" is trivially true.
      await expect(page.locator('#work app-project-card').first()).toBeVisible();
      await expect(page.locator('#work .card.is-loading')).toHaveCount(0, { timeout: 8000 });
    }
    const sizes = await page
      .locator('app-project-card .card')
      .evaluateAll((els) =>
        els.map(
          (e) =>
            `${String(Math.round(e.getBoundingClientRect().width))}x${String(Math.round(e.getBoundingClientRect().height))}`,
        ),
      );
    expect(sizes.length).toBeGreaterThan(1);
    expect(new Set(sizes).size).toBe(1);
  });
}
