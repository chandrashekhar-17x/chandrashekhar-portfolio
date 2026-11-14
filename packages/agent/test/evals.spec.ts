import { beforeAll, describe, expect, it } from 'vitest';

import { ask, buildIndex, type AgentIndex } from '../src';
import { type EvalCase, loadCorpus, loadEvals } from './corpus';

// The agent eval set (content/evals/agent-evals.json) against the no-LLM pipeline.
//
// Two standard RAG metrics, kept separate on purpose:
// - context recall: are the expected facts in what retrieval hands the answer step?
//   (gated: if retrieval misses a fact, no answer step can recover it)
// - answer pass: does the extractive answer itself mention every fact?
//   (reported; the LLM step in the Pages Function is what composes full answers)
// Honest "no" and confidential cases must be exact, always.

/** Chunks handed to the answer step (same as ask() retrieves). */
const CONTEXT_K = 6;
const cases = loadEvals();
let index: AgentIndex;

interface Row {
  id: string;
  kind: EvalCase['kind'];
  contextRecall: number;
  answerPass: boolean;
  ms: number;
  missing: string[];
}
const rows: Row[] = [];

beforeAll(() => {
  index = buildIndex(loadCorpus());
  for (const c of cases) ask(index, c.question); // warm up the JIT before timing
});

const has = (haystack: string, needle: string) =>
  haystack.toLowerCase().includes(needle.toLowerCase());

function run(c: EvalCase): Row & { answer: string; forbidden: string[] } {
  const { answer, results, ms } = ask(index, c.question);
  const context = [answer.text, ...results.slice(0, CONTEXT_K).map((r) => r.chunk.text)].join(' ');
  const facts = c.mustMention ?? [];
  // "Yes" is an answer property, not a fact retrieval can find.
  const missing = facts.filter((f) => !has(f === 'Yes' ? answer.text : context, f));
  const forbidden = (c.mustNotMention ?? []).filter((f) => has(answer.text, f));
  return {
    id: c.id,
    kind: c.kind,
    contextRecall: facts.length ? (facts.length - missing.length) / facts.length : 1,
    answerPass: facts.every((f) => has(answer.text, f)) && !forbidden.length,
    ms,
    missing,
    answer: answer.text,
    forbidden,
  };
}

describe('agent evals', () => {
  for (const c of cases) {
    it(`${c.kind}: ${c.question}`, () => {
      const r = run(c);
      rows.push(r);
      if (process.env['SHOW']) console.log(`\n[${c.id}] ${r.answer}`);
      expect(r.forbidden, `forbidden in: ${r.answer}`).toEqual([]);
      if (c.kind === 'answer') {
        expect(r.missing, `context missed facts for: ${c.question}`).toEqual([]);
      } else {
        expect(r.answerPass, `exact answer required, got: ${r.answer}`).toBe(true);
      }
    });
  }

  it('meets the quality bar', () => {
    const answers = rows.filter((r) => r.kind === 'answer');
    const ms = rows.map((r) => r.ms).sort((a, b) => a - b);
    const p95 = ms[Math.floor(0.95 * (ms.length - 1))] ?? 0;
    const pct = (n: number) => `${String(Math.round(100 * n))}%`;
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    console.table(
      rows.map((r) => ({
        id: r.id,
        recall: r.contextRecall.toFixed(2),
        answer: r.answerPass,
        missing: r.missing.join(', '),
      })),
    );
    console.table({
      cases: rows.length,
      contextRecall: avg(answers.map((r) => r.contextRecall)).toFixed(2),
      extractiveAnswerPass: pct(avg(answers.map((r) => (r.answerPass ? 1 : 0)))),
      honestAndConfidential: pct(
        avg(rows.filter((r) => r.kind !== 'answer').map((r) => (r.answerPass ? 1 : 0))),
      ),
      p95Ms: p95.toFixed(2),
    });
    expect(p95).toBeLessThan(5);
  });
});
