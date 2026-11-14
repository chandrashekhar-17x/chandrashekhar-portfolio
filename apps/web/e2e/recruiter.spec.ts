import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('/recruiter fits the profile on one screen and links onward', async ({ page }) => {
  await page.goto('/recruiter');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chandrashekhar');
  await expect(page.getByText(/\d\+ yrs experience/)).toBeVisible();

  const best = page.getByRole('region', { name: 'Best work' }).getByRole('link');
  await expect(best).toHaveCount(3);
  await expect(best.first()).toHaveAttribute('href', '/work/custom-cad-editor');

  for (const name of ['Contact me', 'Resume', /LinkedIn/, /GitHub/]) {
    await expect(
      page.getByRole('navigation', { name: 'Contact and links' }).getByRole('link', { name }),
    ).toBeVisible();
  }

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );
});

test('desktop: the whole recruiter view fits in one 1440×900 screen', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one-screen promise is for desktop');
  await page.goto('/recruiter');
  const bottom = await page.locator('.sheet').evaluate((el) => el.getBoundingClientRect().bottom);
  expect(bottom).toBeLessThanOrEqual(900);
});

test('the nav and ⌘K both reach the recruiter view', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox').fill('recruiter');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/recruiter$/);
});
