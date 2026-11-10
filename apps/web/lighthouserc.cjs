// Lighthouse CI: performance / a11y / best-practices / SEO budgets for the built SSR app.
// Run: make lighthouse (after make build). Targets: docs/PRD.md + docs/testing.md.
const { chromium } = require('@playwright/test');

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node dist/web/server/server.mjs',
      startServerReadyPattern: 'listening',
      url: ['http://localhost:4000/', 'http://localhost:4000/work', 'http://localhost:4000/resume'],
      numberOfRuns: 3, // median of 3 smooths out noise
      chromePath: chromium.executablePath(),
      settings: {
        preset: 'desktop',
        chromeFlags: '--headless=new --no-sandbox',
      },
    },
    assert: {
      // Judge the median run: the default ("optimistic") takes the best run, which
      // let a 63-scoring page pass on one lucky 98.
      assertions: {
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'categories:seo': ['error', { minScore: 0.95, aggregationMethod: 'median-run' }],
        'largest-contentful-paint': [
          'error',
          { maxNumericValue: 2000, aggregationMethod: 'median-run' },
        ],
        'cumulative-layout-shift': [
          'error',
          { maxNumericValue: 0.05, aggregationMethod: 'median-run' },
        ],
        'total-blocking-time': ['warn', { maxNumericValue: 200, aggregationMethod: 'median-run' }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
