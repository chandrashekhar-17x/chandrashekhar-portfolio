import assert from 'node:assert/strict';
import { test } from 'node:test';
import { siteOrigin } from './site-origin.mjs';

test('normalizes the public origin for all SEO consumers', () => {
  assert.equal(siteOrigin(' https://example.dev/ '), 'https://example.dev');
  assert.equal(siteOrigin('http://localhost:4200'), 'http://localhost:4200');
  assert.equal(siteOrigin(''), 'https://chandrashekhar.dev');
});

test('rejects invalid origins rather than publishing broken canonical URLs', () => {
  for (const value of [
    'example.dev',
    'javascript:alert(1)',
    'https://user:password@example.dev',
    'https://example.dev/path',
    'https://example.dev?query=true',
    'https://example.dev#fragment',
  ]) {
    assert.throws(() => siteOrigin(value));
  }
});
