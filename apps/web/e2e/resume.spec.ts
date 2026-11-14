import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('/resume shows both versions: the portfolio resume and my PDF', async ({ page }) => {
  await page.goto('/resume');
  const site = page.getByRole('tab', { name: /Portfolio resume/ });
  const pdf = page.getByRole('tab', { name: /My resume/ });
  await expect(site).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Experience' })).toBeVisible();

  await pdf.click();
  await expect(pdf).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/\/resume#pdf$/);
  await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveAttribute(
    'href',
    '/resume.pdf',
  );
  // Headless Chromium has no PDF viewer: the fallback preview image is shown.
  await expect(page.getByRole('img', { name: /Preview of my resume/ })).toBeVisible();

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
    [],
  );

  // Arrow keys move between the tabs.
  await pdf.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(site).toBeFocused();
  await expect(site).toHaveAttribute('aria-selected', 'true');
});

test('/resume#pdf opens the PDF tab, and the files are served', async ({ page, request }) => {
  await page.goto('/resume#pdf');
  await expect(page.getByRole('tab', { name: /My resume/ })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const pdf = await request.get('/resume.pdf');
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  expect((await request.get('/resume.png')).status()).toBe(200);
});
