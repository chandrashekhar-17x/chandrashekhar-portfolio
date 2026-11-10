import { expect, test } from '@playwright/test';

test('About is server-rendered and a card filters the graph to its cluster', async ({ page }) => {
  await page.goto('/');
  const areas = page.getByRole('list', { name: 'Areas of experience' });
  await expect(areas.locator(':scope > li')).toHaveCount(7);

  await page
    .getByRole('button', { name: 'CAD & visualization: show in the knowledge graph' })
    .click();
  await expect(page).toHaveURL(/#graph$/);
  // The graph loads lazily, then opens with the CAD filter already on.
  const cad = page.locator('app-graph-filters button', { hasText: 'CAD' }).first();
  await expect(cad).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
});

test('no sample data is left on the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText(
    /Company A|Company B|30\+ projects|4\+ years/,
  );
});
