import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiOrigin, siteOrigin } from './site-origin.mjs';

test('normalizes the public origin for all SEO consumers', () => {
  assert.equal(siteOrigin(' https://example.dev/ '), 'https://example.dev');
  assert.equal(siteOrigin('http://localhost:4200'), 'http://localhost:4200');
  assert.equal(siteOrigin(''), 'https://chandrashekhar.pages.dev');
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

test('API origin is optional: unset means the bundled content is used', () => {
  assert.equal(apiOrigin(undefined), null);
  assert.equal(apiOrigin('  '), null);
  assert.equal(apiOrigin('https://api.example.dev/'), 'https://api.example.dev');
  assert.throws(() => apiOrigin('https://api.example.dev/v1'));
});
