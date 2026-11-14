// A/B eval of the on-device LLM (WebLLM) in a real browser: every "answer" eval
// case is asked with on-device AI off (baseline) and on, and both are scored.
//   make eval-ondevice            (needs a built app: `make build`; opens Chrome)
// Needs a GPU with WebGPU, so it runs headed Chrome and is not part of CI.
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const PORT = 4321;
const base = `http://localhost:${String(PORT)}`;
const evals = JSON.parse(
  readFileSync(new URL('../../../content/evals/agent-evals.json', import.meta.url), 'utf8'),
).cases.filter((c) => c.kind === 'answer');

const server = spawn('node', ['dist/web/server/server.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'inherit'],
});
await new Promise((resolve) =>
  server.stdout.on('data', (d) => String(d).includes('listening') && resolve()),
);

const browser = await chromium.launch({
  channel: 'chrome',
  headless: false, // WebGPU needs the real GPU
  args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan'],
});
const page = await browser.newPage();
await page.goto(base);
await page.getByRole('button', { name: 'Talk to my AI agent' }).last().click();
const panel = page.getByRole('dialog', { name: 'Talk to My Agent.' });
const toggle = panel.locator('.ai-toggle');

async function askAll(label) {
  const rows = [];
  for (const c of evals) {
    const before = await panel.locator('.msg.agent').count();
    const t0 = Date.now();
    await panel.getByRole('textbox').fill(c.question);
    await panel.getByRole('button', { name: 'Send' }).click();
    const msg = panel.locator('.msg.agent').nth(before);
    await msg.waitFor({ timeout: 120_000 });
    // Done when the text stops changing for 1.5 s.
    let last = '';
    for (;;) {
      await page.waitForTimeout(1500);
      const now = (await msg.locator('p.text').textContent()) ?? '';
      if (now && now === last) break;
      last = now;
    }
    const text = last.trim();
    const lower = text.toLowerCase();
    const missing = (c.mustMention ?? []).filter((m) => !lower.includes(m.toLowerCase()));
    const forbidden = (c.mustNotMention ?? []).filter((m) => lower.includes(m.toLowerCase()));
    rows.push({
      id: c.id,
      pass: !missing.length && !forbidden.length,
      words: text.split(/\s+/).length,
      ms: Date.now() - t0 - 1500,
      text,
    });
    console.log(
      `[${label}] ${c.id}: ${!missing.length && !forbidden.length ? 'PASS' : `FAIL (${[...missing, ...forbidden].join(', ')})`} :: ${text.slice(0, 140)}`,
    );
  }
  return rows;
}

const off = await askAll('off');
await toggle.click();
console.log('Loading the on-device model (first time: ~1 GB download)…');
await panel.locator('.ai-toggle.on').waitFor({ timeout: 30 * 60_000 });
const on = await askAll('on');

const summary = (rows) => ({
  pass: `${String(rows.filter((r) => r.pass).length)}/${String(rows.length)}`,
  avgWords: Math.round(rows.reduce((s, r) => s + r.words, 0) / rows.length),
  p50ms: rows.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(rows.length / 2)],
});
const report = {
  off: summary(off),
  on: summary(on),
  changed: on.filter((r, i) => r.text !== off[i]?.text).length,
};
console.table(report);
writeFileSync(
  new URL('../../../ondevice-eval.json', import.meta.url),
  JSON.stringify({ report, off, on }, null, 2),
);
await browser.close();
server.kill();
