import { Page, expect, test } from '@playwright/test';

// Visual regression: each home section and key pages, desktop + mobile, both themes.
// Update baselines on purpose with `make visual-update` (inside Docker).

const SECTIONS = ['graph', 'work', 'lab', 'xp', 'contact'] as const;

async function prepare(page: Page, theme: 'dark' | 'light'): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem('theme', t);
  }, theme);
}

/**
 * Fonts use `font-display: optional` (no layout shift for real users): on a cold
 * first load they may miss the ~100 ms window and the fallback is kept. For stable
 * screenshots, load once to fill the cache, reload, and insist the fonts are in use.
 */
async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() =>
    ['Bricolage Grotesque Variable', 'Inter Tight Variable', 'JetBrains Mono Variable'].filter(
      (f) => !document.fonts.check(`16px "${f}"`),
    ),
  );
  expect(missing, 'web fonts not in use').toEqual([]);
}

for (const theme of ['dark', 'light'] as const) {
  test.describe(theme, () => {
    test.beforeEach(async ({ page }) => {
      await prepare(page, theme);
    });

    test('hero and stats', async ({ page }) => {
      await open(page, '/');
      await expect(page.locator('.first-screen')).toHaveScreenshot(`${theme}-hero.png`);
    });

    for (const id of SECTIONS) {
      test(`home section: ${id}`, async ({ page }) => {
        await open(page, '/');
        const section = page.locator(`#${id}`);
        await section.scrollIntoViewIfNeeded();
        await expect(section.locator('.is-revealed')).toBeVisible({ timeout: 10_000 });
        await expect(section.locator('.is-loading')).toHaveCount(0, { timeout: 10_000 });
        await expect(section).toHaveScreenshot(`${theme}-section-${id}.png`);
      });
    }

    for (const [name, path] of [
      ['work', '/work'],
      ['case-study', '/work/cad-editor'],
      ['resume', '/resume'],
      ['not-found', '/nope'],
    ] as const) {
      test(`page: ${name}`, async ({ page }) => {
        await open(page, path);
        await expect(page.locator('main')).toHaveScreenshot(`${theme}-page-${name}.png`);
      });
    }
  });
}
