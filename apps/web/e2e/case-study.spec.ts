import { expect, test } from '@playwright/test';

test('case study: TOC anchors, R&D stepper, chip groups, problem cards, pager', async ({
  page,
}) => {
  await page.goto('/work/custom-cad-editor');

  // Every TOC link points at a section that exists on the page.
  const toc = page.getByRole('navigation', { name: 'On this page' });
  const hrefs = await toc
    .getByRole('link')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
  expect(hrefs.length).toBeGreaterThan(5);
  for (const href of hrefs) {
    await expect(page.locator(`#${href.split('#')[1] ?? ''}`)).toHaveCount(1);
  }

  // Stepper shows the 3 approaches with their outcome markers.
  const journey = page.locator('#my-r-d-journey');
  await expect(journey).toContainText('Approach 1');
  for (const mark of ['✗', '◐', '✓']) await expect(journey).toContainText(mark);

  await expect(page.locator('#what-i-built .group')).toHaveCount(5);
  const problem = page.locator('#hard-problems-how-i-solved-them details').first();
  await problem.locator('summary').click();
  await expect(problem).toHaveAttribute('open', '');

  const pager = page.getByRole('navigation', { name: 'More projects' });
  await pager.getByRole('link', { name: /Next/ }).click();
  await expect(page).not.toHaveURL(/custom-cad-editor$/);
  await expect(
    page.getByRole('navigation', { name: 'More projects' }).getByRole('link', { name: /Previous/ }),
  ).toBeVisible();
});

test('employer case studies keep their confidentiality note', async ({ page }) => {
  await page.goto('/work/progressive-pdf-viewer');
  await expect(page.locator('#intro')).toContainText('Employer project');
});

test('case study never scrolls sideways (wide code blocks scroll inside)', async ({ page }) => {
  await page.goto('/work/custom-cad-editor');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('case study has its own preview image and Article data', async ({ page, request }) => {
  await page.goto('/work/custom-cad-editor');
  const og = await page.locator('meta[property="og:image"]').getAttribute('content');
  expect(og).toMatch(/\/og\/work\/custom-cad-editor\.jpg$/);
  expect((await request.get(new URL(og ?? '').pathname)).headers()['content-type']).toContain(
    'image/jpeg',
  );
  const ld = JSON.parse((await page.locator('#ld-article').textContent()) ?? '{}') as Record<
    string,
    unknown
  >;
  expect(ld['@type']).toBe('Article');
  expect(ld['headline']).toBe('Custom CAD Viewer & Editor, built from zero');
});

test('"Ask my agent about this project" answers from that project and cites it', async ({
  page,
}) => {
  await page.goto('/work/progressive-pdf-viewer');
  await page.getByRole('button', { name: /ask my agent about this project/i }).click();
  const chat = page.getByRole('dialog', { name: /agent/i });
  await expect(chat).toContainText('Tell me about Progressive PDF Viewer');
  await expect(chat).toContainText('Built with PDF.js, HTTP Range Requests, Virtualization.');
  await expect(chat.getByText('Progressive PDF Viewer', { exact: true })).toBeVisible();
});
