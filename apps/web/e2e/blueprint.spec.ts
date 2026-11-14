import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('footer button turns the page into a blueprint; Esc exits', async ({ page }) => {
  await page.goto('/');
  const button = page.getByRole('button', { name: /view as blueprint/i });
  await button.scrollIntoViewIfNeeded();
  await button.click();

  await expect(page.locator('html')).toHaveAttribute('data-blueprint', '');
  const block = page.getByRole('status', { name: 'Blueprint mode' });
  await expect(block).toContainText('SCALE 1:1');
  // A dimension label shows a real section width in px.
  await expect(page.locator('.bp-svg .val text').first()).toHaveText(/^\d+$/);

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );

  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveAttribute('data-blueprint');
  await expect(block).toHaveCount(0);
});

test('⌘K command and the DevTools API both reach blueprint mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => 'chandrashekhar' in window);
  const reply = await page.evaluate(() =>
    (window as unknown as { chandrashekhar: { blueprint(): string } }).chandrashekhar.blueprint(),
  );
  expect(reply).toContain('on');
  await expect(page.locator('html')).toHaveAttribute('data-blueprint', '');

  await page.keyboard.press('Control+k');
  await page.getByRole('combobox').fill('blueprint');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).not.toHaveAttribute('data-blueprint');
});

test('footer shows the time in Hyderabad', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer')).toContainText(/Hyderabad \d\d:\d\d IST · probably/);
});

test('blueprint tags show how lazy sections loaded', async ({ page }) => {
  await page.goto('/');
  const work = page.locator('#work');
  await work.scrollIntoViewIfNeeded();
  await expect(work.locator('.is-revealed')).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox').fill('blueprint');
  await page.keyboard.press('Enter');
  // Put the top edge of #work in view, below the sticky nav.
  await page.evaluate(() => {
    const top = document.querySelector('#work')?.getBoundingClientRect().top ?? 0;
    scrollTo(0, top + scrollY - 300);
  });
  await expect(page.locator('.bp-svg .tag', { hasText: '#work' })).toHaveText(
    /#work · @defer #\d+ · \+\d+\.\d\d s/,
  );
});
