// Turns the build into a fully static site for Cloudflare Pages (no Node server needed).
// Every content page is already prerendered; this adds what the Express server
// normally answers itself: robots.txt, sitemap.xml and a real 404 page, plus _headers.
// Run after `ng build`: `pnpm --filter @portfolio/web build:static`.
import { spawn } from 'node:child_process';
import { readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 4123;
const out = new URL('../dist/web/browser/', import.meta.url);
const base = `http://localhost:${String(PORT)}`;

const server = spawn('node', ['dist/web/server/server.mjs'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'inherit'],
});

try {
  await new Promise((resolve, reject) => {
    server.stdout.on('data', (chunk) => {
      if (String(chunk).includes('listening')) resolve(undefined);
    });
    server.on('exit', (code) => reject(new Error(`server exited (${String(code)})`)));
    setTimeout(() => reject(new Error('server did not start in 20 s')), 20_000);
  });

  const save = async (path, file, expectedStatus = 200) => {
    const res = await fetch(base + path);
    if (res.status !== expectedStatus) {
      throw new Error(`${path}: expected ${String(expectedStatus)}, got ${String(res.status)}`);
    }
    writeFileSync(new URL(file, out), await res.text());
    console.log(`✓ ${file}`);
  };
  await save('/robots.txt', 'robots.txt');
  await save('/sitemap.xml', 'sitemap.xml');
  // Cloudflare Pages serves 404.html (with status 404) for any unknown path.
  await save('/this-page-does-not-exist', '404.html', 404);
} finally {
  server.kill();
}

// Cloudflare Pages redirects /work → /work/ when the page is work/index.html,
// but serves work.html at /work directly. Flatten so URLs match the canonical ones.
function flatten(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (!statSync(path).isDirectory()) continue;
    flatten(path);
    try {
      renameSync(join(path, 'index.html'), `${path}.html`);
    } catch {
      // folder without a page (e.g. fonts/, og/)
    }
  }
}
flatten(fileURLToPath(out));
console.log('✓ pages flattened (work/index.html → work.html)');

// Security headers for every page; long caching only for hashed build files.
writeFileSync(
  new URL('_headers', out),
  `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), geolocation=(), microphone=(), interest-cohort=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=2592000
`,
);
console.log('✓ _headers');
