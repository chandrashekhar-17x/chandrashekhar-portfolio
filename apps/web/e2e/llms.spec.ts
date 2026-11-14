import { expect, test } from '@playwright/test';

// Plain-Markdown portfolio for AI assistants (llmstxt.org).
test('/llms.txt and /llms-full.txt serve the portfolio as Markdown', async ({ request }) => {
  const short = await request.get('/llms.txt');
  expect(short.status()).toBe(200);
  expect(short.headers()['content-type']).toContain('text/markdown');
  const txt = await short.text();
  expect(txt).toMatch(/^# Chandrashekhar\n\n> /);
  expect(txt).toContain('/work/custom-cad-editor)');
  expect(txt).not.toContain('@'); // no email anywhere

  const full = await (await request.get('/llms-full.txt')).text();
  expect(full).toContain('# Case study: Custom CAD Viewer');
  expect(full).not.toMatch(/^slug: /m); // front matter stripped
});
