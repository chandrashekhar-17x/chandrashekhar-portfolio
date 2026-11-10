import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';

// WCAG 2.2 AA checks with axe on every route, in both themes (docs/testing.md:
// "0 serious violations"). Moderate/minor findings are reported but don't fail.
const ROUTES = [
  '/',
  '/work',
  '/work/custom-cad-editor',
  '/graph',
  '/lab',
  '/resume',
  '/journal',
  '/nope',
];

async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  const summary = blocking.map(
    (v) =>
      `${v.id} (${v.impact ?? 'unknown'}): ${v.help}\n    ${v.nodes
        .map((n) => n.target.join(' '))
        .slice(0, 4)
        .join('\n    ')}`,
  );
  expect(summary, summary.join('\n')).toEqual([]);
}

for (const theme of ['dark', 'light'] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' }); // stable, fully revealed content
      if (theme === 'light') {
        await page.addInitScript(() => {
          localStorage.setItem('theme', 'light');
        });
      }
    });

    for (const path of ROUTES) {
      test(`${path} has no serious accessibility issues`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await audit(page);
      });
    }

    test('home with every lazy section loaded has no serious issues', async ({ page }) => {
      await page.goto('/');
      for (const id of ['graph', 'work', 'lab', 'xp', 'contact']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        await expect(page.locator(`#${id} .is-revealed`)).toBeVisible({ timeout: 8000 });
      }
      await audit(page);
    });
  });
}
