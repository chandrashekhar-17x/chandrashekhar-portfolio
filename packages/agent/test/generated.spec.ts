import { describe, expect, it } from 'vitest';

import { ask, buildIndex } from '../src';
import { loadCorpus } from './corpus';
import { generateCases } from './generated';

// ~1,000 generated questions (see generated.ts). Prints the pass rate per group and
// the failures; fails the build if the overall pass rate drops below the gate.

/** Raise this as the agent improves; never lower it to make a change pass. */
const GATE = 0.98;

describe('generated evals (~1,000 questions)', () => {
  it('passes the gate', () => {
    const corpus = loadCorpus();
    const index = buildIndex(corpus);
    const cases = generateCases(corpus, index.years);
    const groups = new Map<string, { pass: number; total: number }>();
    const failures: string[] = [];

    for (const c of cases) {
      const { answer } = ask(index, c.question);
      const why = c.check(answer);
      const g = groups.get(c.group) ?? { pass: 0, total: 0 };
      g.total += 1;
      if (why) failures.push(`[${c.group}] ${c.question} → ${why} :: ${answer.text.slice(0, 120)}`);
      else g.pass += 1;
      groups.set(c.group, g);
    }

    const passed = cases.length - failures.length;
    console.table(
      Object.fromEntries([...groups].map(([k, g]) => [k, `${String(g.pass)}/${String(g.total)}`])),
    );
    console.log(
      `TOTAL ${String(passed)}/${String(cases.length)} (${((100 * passed) / cases.length).toFixed(1)}%)`,
    );
    if (process.env['SHOW']) console.log(failures.join('\n'));
    expect(passed / cases.length).toBeGreaterThanOrEqual(GATE);
  });
});
