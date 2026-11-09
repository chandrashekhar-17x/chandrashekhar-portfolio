import { expect, test } from '@playwright/test';

test('section links scroll the home page (desktop) or sit in the menu (mobile)', async ({
  page,
  isMobile,
}) => {
  await page.goto('/work');
  const nav = page.getByRole('navigation', { name: 'Main' });

  if (isMobile) {
    await expect(nav.getByRole('link', { name: 'Work' })).toBeHidden();
    const burger = nav.getByRole('button', { name: 'Menu' });
    await burger.click();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#mobile-menu').getByRole('link', { name: 'Contact' }).click();
  } else {
    await nav.getByRole('link', { name: 'Contact' }).click();
  }
  await expect(page).toHaveURL(/\/#contact$/);
});
