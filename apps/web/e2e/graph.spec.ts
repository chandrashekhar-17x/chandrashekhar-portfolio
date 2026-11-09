import { expect, test } from '@playwright/test';

test.describe('knowledge graph', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#graph').scrollIntoViewIfNeeded();
    await expect(page.locator('#graph app-graph-explorer')).toBeVisible();
  });

  test('draws on a canvas with an accessible summary', async ({ page }) => {
    const canvas = page.locator('#graph app-graph-canvas canvas');
    await expect(canvas).toHaveAttribute('aria-label', /Knowledge graph with \d+ nodes/);
  });

  test('filters show counts and toggle with aria-pressed', async ({ page }) => {
    const projects = page.getByRole('button', { name: /Projects\s*\d+/ });
    await projects.click();
    await expect(projects).toHaveAttribute('aria-pressed', 'true');
    await projects.click();
    await expect(projects).toHaveAttribute('aria-pressed', 'false');
  });

  test('list view lists every category with connections', async ({ page }) => {
    await page.getByRole('button', { name: 'View as list' }).click();
    await expect(page.getByRole('heading', { name: /Projects \(\d+\)/ })).toBeVisible();
    await expect(page.locator('app-graph-list b', { hasText: 'Canvas CAD Editor' })).toBeVisible();
    await page.getByRole('button', { name: 'Show graph' }).click();
    await expect(page.locator('#graph app-graph-canvas')).toBeVisible();
  });

  test('hovering a node shows a tooltip (desktop)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'hover needs a mouse');
    test.setTimeout(60_000); // pointer sweeps are slow on shared CI runners
    // Reduced motion → the seeded layout is settled and static, so nodes don't move
    // while we search for one.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.locator('#graph').scrollIntoViewIfNeeded();
    const canvas = page.locator('#graph app-graph-canvas canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('no canvas');

    // Search outward from the centre (where nodes cluster) on a 16px grid,
    // within the central 400×400 area.
    const cx = box.width / 2;
    const cy = box.height / 2;
    const points: [number, number][] = [];
    for (let y = cy - 200; y < cy + 200; y += 16) {
      for (let x = cx - 200; x < cx + 200; x += 16) points.push([x, y]);
    }
    points.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy));

    const tip = page.locator('app-graph-canvas .tip.on');
    for (const [x, y] of points) {
      await page.mouse.move(box.x + x, box.y + y);
      if (await tip.count()) {
        await expect(tip.locator('b')).not.toBeEmpty();
        return;
      }
    }
    throw new Error('no node found under the pointer');
  });
});

test('/graph shows the full-screen graph', async ({ page }) => {
  await page.goto('/graph');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Everything I know/);
  await expect(page.locator('app-graph-explorer.tall')).toBeVisible();
});

test('list view fits its panel and scrolls to the last group', async ({ page }) => {
  await page.goto('/graph');
  await page.getByRole('button', { name: 'View as list' }).click();
  const last = page.locator('app-graph-list section').last();
  await last.scrollIntoViewIfNeeded();
  await expect(last.locator('li').first()).toBeVisible();
});
