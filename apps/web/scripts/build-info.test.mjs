import assert from 'node:assert/strict';
import test from 'node:test';

import { buildInfo, parseLog, tidySubject } from './build-info.mjs';

test('merge commits read as the PR and branch', () => {
  assert.equal(
    tidySubject('Merge pull request #20 from chandrashekhar-17x/feat/api-deploy'),
    'PR #20 · feat/api-deploy',
  );
  assert.equal(tidySubject('feat(web): blueprint mode'), 'feat(web): blueprint mode');
});

test('parses git log output and rejects junk', () => {
  const sha = 'a'.repeat(40);
  assert.deepEqual(parseLog(`${sha}\n2026-11-14T10:00:00+05:30\nfix: thing\n`), {
    sha,
    date: '2026-11-14T10:00:00+05:30',
    subject: 'fix: thing',
  });
  assert.equal(parseLog(''), null);
  assert.equal(parseLog('fatal: not a git repository'), null);
});

test('this checkout has build info', () => {
  assert.match(buildInfo()?.sha ?? '', /^[0-9a-f]{40}$/);
});
