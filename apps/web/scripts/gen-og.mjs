// Renders one 1200×630 social-preview image per project into public/og/work/<slug>.jpg.
// Run after changing project titles: `pnpm --filter @portfolio/web gen:og`, then commit the images.
// Recreated art only (title, kind, tags): never employer screenshots.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const root = new URL('../../../', import.meta.url);
const { projects } = JSON.parse(readFileSync(new URL('content/data/projects.json', root), 'utf8'));
const outDir = new URL('../public/og/work/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const font = (pkg, file) =>
  new URL(`../node_modules/@fontsource-variable/${pkg}/files/${file}`, import.meta.url).href;

/** Case-study frontmatter `title:` (e.g. "Building a CAD editor from zero"), else the project title. */
function headline(project) {
  const md = readFileSync(new URL(`content/${project.body}`, root), 'utf8');
  const fm = /^---\n([\s\S]*?)\n---/.exec(md)?.[1] ?? '';
  return /^title:\s*(.+)$/m.exec(fm)?.[1]?.trim() ?? project.title;
}

const kind = (p) =>
  p.type === 'professional' ? 'Professional · details anonymised' : 'Personal project';

const escape = (s) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const page = (p) => `<!doctype html><html><head><style>
@font-face { font-family: Display; src: url(${font('bricolage-grotesque', 'bricolage-grotesque-latin-wght-normal.woff2')}); font-weight: 200 800; }
@font-face { font-family: Body; src: url(${font('inter-tight', 'inter-tight-latin-wght-normal.woff2')}); font-weight: 100 900; }
@font-face { font-family: Mono; src: url(${font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}); font-weight: 100 800; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; padding: 72px 80px; display: flex; flex-direction: column;
  background: radial-gradient(900px 500px at 85% 15%, #8b5cf633, transparent),
    radial-gradient(700px 400px at 10% 100%, #22d3ee22, transparent), #06071a;
  color: #ecebff; font-family: Body, sans-serif; }
.kind { font: 600 22px Mono, monospace; letter-spacing: .12em; text-transform: uppercase; color: #22d3ee; }
h1 { margin-top: 28px; font: 800 76px/1.02 Display, sans-serif; letter-spacing: -.035em; max-width: 1000px; }
.tags { margin-top: auto; display: flex; flex-wrap: wrap; gap: 12px; }
.tags span { padding: 8px 16px; border: 1.5px solid #8c96ff55; border-radius: 10px; font: 500 22px Mono, monospace; color: #a9a8d6; }
.brand { position: absolute; right: 80px; top: 72px; font: 800 30px Display, sans-serif; }
.brand b { color: #8b5cf6; }
</style></head><body>
<div class="brand">CS<b>.</b>dev</div>
<p class="kind">${escape(kind(p))}</p>
<h1>${escape(headline(p))}</h1>
<div class="tags">${p.tags
  .slice(0, 5)
  .map((t) => `<span>${escape(t)}</span>`)
  .join('')}</div>
</body></html>`;

// A file:// page may load the file:// fonts (setContent's about:blank may not).
const tmp = mkdtempSync(join(tmpdir(), 'og-'));
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const p of projects) {
  const html = join(tmp, `${p.slug}.html`);
  writeFileSync(html, page(p));
  await tab.goto(pathToFileURL(html).href, { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  const path = fileURLToPath(new URL(`${p.slug}.jpg`, outDir));
  await tab.screenshot({ path, type: 'jpeg', quality: 86 });
  console.log(`✓ og/work/${p.slug}.jpg`);
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
