import { expect, test } from '@playwright/test';

for (const theme of ['dark', 'light'] as const) {
  test(`featured case study loads with its summary and journey in ${theme} theme`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((value) => {
      localStorage.setItem('theme', value);
    }, theme);
    await page.goto('/');
    const section = page.locator('#featured');
    await section.scrollIntoViewIfNeeded();
    await expect(section.locator('.tldr li')).toHaveCount(3);
    await expect(section.locator('.journey li:not(.arrow)')).toHaveCount(3);
    await section.getByRole('link', { name: 'Read the case study' }).click();
    await expect(page).toHaveURL(/\/work\/custom-cad-editor$/);
  });
}

test('SEO metadata, JSON-LD, sitemap and robots share the same public origin', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  const origin = new URL(canonical ?? '').origin;
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', origin);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    `${origin}/og/default.jpg`,
  );
  expect(await page.locator('#ld-person').textContent()).toContain(`${origin}/#person`);
  expect(await (await request.get('/sitemap.xml')).text()).toContain(`<loc>${origin}/</loc>`);
  expect(await (await request.get('/robots.txt')).text()).toContain(
    `Sitemap: ${origin}/sitemap.xml`,
  );
});
