import { expect, test } from '@playwright/test';

test("the graph sums up the visitor's trail and turns it into a question", async ({ page }) => {
  // Six explored nodes, mostly CAD (what lingering on nodes records).
  await page.addInitScript(() => {
    sessionStorage.setItem(
      'graph-trail',
      JSON.stringify([
        'skill:threejs',
        'skill:webgl',
        'skill:dxf',
        'skill:angular',
        'project:enterprise-ui-architecture',
        'skill:canvas',
      ]),
    );
  });
  await page.goto('/');
  const graph = page.locator('#graph');
  await graph.scrollIntoViewIfNeeded();

  const trail = graph.locator('.trail');
  await expect(trail).toContainText('You explored 6 nodes, mostly CAD & visualization (4)');
  await trail.getByRole('button', { name: /Ask:/ }).click();
  await expect(page.getByRole('dialog', { name: /agent/i })).toContainText('Three.js');

  await trail.getByRole('button', { name: 'reset' }).click();
  await expect(trail).toHaveCount(0);
});
