import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the real production build (SSR server),
// so they catch what users actually get. Build first: `make build`.
const PORT = 4320;
const baseURL = `http://localhost:${String(PORT)}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node dist/web/server/server.mjs',
    url: baseURL,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env['CI'],
    timeout: 30_000,
  },
});
