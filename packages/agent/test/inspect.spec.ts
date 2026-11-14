import { it } from 'vitest';
import { ask, buildIndex } from '../src';
import { loadCorpus } from './corpus';

// Debug helper: Q="question" npx vitest run test/inspect.spec.ts
it.runIf(!!process.env['Q'])('inspect', () => {
  const index = buildIndex(loadCorpus());
  const t = ask(index, process.env['Q'] ?? '');
  console.log(
    t.results
      .map((r) => `${r.score.toFixed(4)} bm25=${r.bm25.toFixed(1)} ${r.chunk.id}`)
      .join('\n'),
  );
  console.log(`\n${t.answer.kind}: ${t.answer.text}\ncites: ${t.answer.citations.join(', ')}`);
});
