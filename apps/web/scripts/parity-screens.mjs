// Prototype ↔ Angular parity: screenshots each home section of prototype/index.html
// and of the built app at the same width/theme, for side-by-side review.
// Usage: node scripts/parity-screens.mjs <outDir> <appUrl>
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const [outDir, appUrl = 'http://localhost:4000'] = process.argv.slice(2);
if (!outDir) throw new Error('usage: parity-screens.mjs <outDir> [appUrl]');
const prototype = 'file://' + resolve(import.meta.dirname, '../../../prototype/index.html');
const SECTIONS = ['hero', 'graph', 'work', 'lab', 'xp', 'contact'];
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
for (const theme of ['dark', 'light']) {
  // Prototype: the site lives inside a fake browser frame with its own scroller.
  const proto = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await proto.goto(prototype);
  if (theme === 'light') await proto.click('#themeBtn');
  await proto.waitForTimeout(800);
  const width = Math.round((await proto.locator('#site').boundingBox()).width);

  const app = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  await app.addInitScript((t) => localStorage.setItem('theme', t), theme);
  await app.goto(appUrl);
  await app.reload(); // fonts from cache (font-display: optional)
  await app.evaluate(() => document.fonts.ready);

  for (const id of SECTIONS) {
    const protoSel = id === 'hero' ? '#site .hero' : `#site #${id}`;
    await proto.evaluate((sel) => {
      const el = document.querySelector(sel);
      document.querySelector('#scroller').scrollTo(0, el.offsetTop - 40);
    }, protoSel);
    await proto.waitForTimeout(id === 'hero' ? 2500 : 4500); // prototype's own lazy-load demo
    await proto.locator(protoSel).screenshot({ path: `${outDir}/${theme}-${id}-prototype.png` });

    const appSel = id === 'hero' ? '.first-screen' : `#${id}`;
    await app.locator(appSel).scrollIntoViewIfNeeded();
    if (id !== 'hero') await app.locator(`#${id} .is-revealed`).waitFor({ timeout: 10_000 });
    await app.waitForTimeout(400);
    await app.addStyleTag({ content: 'app-site-nav,app-chat-widget{visibility:hidden!important}' });
    await app.locator(appSel).screenshot({ path: `${outDir}/${theme}-${id}-angular.png` });
    console.log(`✓ ${theme} ${id}`);
  }
}
await browser.close();
