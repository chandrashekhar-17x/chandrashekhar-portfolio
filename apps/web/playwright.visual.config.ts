import { defineConfig, devices } from '@playwright/test';

// Screenshot (visual regression) tests. Run them inside the Playwright Docker image
// (`make visual`) so rendering is identical locally and in CI; host-rendered
// screenshots differ slightly in font anti-aliasing and would flake.
const PORT = 4321;
const baseURL = `http://localhost:${String(PORT)}`;

export default defineConfig({
  testDir: './e2e-visual',
  testMatch: '**/*.visual.ts',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env['CI'],
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
      stylePath: './e2e-visual/screenshot.css',
    },
  },
  use: {
    baseURL,
    reducedMotion: 'reduce', // static canvases, no typing/reveal animations
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node dist/web/server/server.mjs',
    url: baseURL,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env['CI'],
    timeout: 30_000,
  },
});
