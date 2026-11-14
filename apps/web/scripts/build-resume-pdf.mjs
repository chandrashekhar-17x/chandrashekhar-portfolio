// content/resume/resume.html → resume.pdf + resume.png preview (`make resume-pdf`).
// Uses Playwright's Chromium, so the PDF has real, selectable text (ATS-friendly)
// and the same fonts as the website.
import { chromium } from '@playwright/test';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const resumeDir = fileURLToPath(new URL('../../../content/resume/', import.meta.url));
const fonts = fileURLToPath(new URL('../node_modules/@fontsource-variable/', import.meta.url));

// The HTML refers to fonts/…; put it next to the font files in a scratch folder.
const work = mkdtempSync(join(tmpdir(), 'resume-'));
try {
  mkdirSync(join(work, 'fonts'));
  copyFileSync(
    join(fonts, 'inter-tight/files/inter-tight-latin-wght-normal.woff2'),
    join(work, 'fonts/inter-tight.woff2'),
  );
  copyFileSync(
    join(fonts, 'bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2'),
    join(work, 'fonts/bricolage.woff2'),
  );
  copyFileSync(join(resumeDir, 'resume.html'), join(work, 'resume.html'));

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(join(work, 'resume.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: join(resumeDir, 'resume.pdf'),
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    tagged: true, // accessible PDF structure
  });
  // Preview image for browsers that can't embed PDFs (most phones): A4 at 2x.
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.emulateMedia({ media: 'print' });
  await page.addStyleTag({ content: 'body { padding: 42px 49px; }' });
  await page.screenshot({ path: join(resumeDir, 'resume.png'), fullPage: true, scale: 'device' });
  await browser.close();
  console.log('✓ content/resume/resume.pdf + resume.png');
} finally {
  rmSync(work, { recursive: true, force: true });
}
