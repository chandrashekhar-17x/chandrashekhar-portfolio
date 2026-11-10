import evals from '../../../../../../content/evals/agent-evals.json';
import { FALLBACK_ANSWER, pickAnswer } from './scripted-answers';

// The §9 eval set (content/evals/agent-evals.json) run against the scripted chat.
// Phase 4 runs the same file against the real RAG agent.

interface EvalCase {
  id: string;
  question: string;
  mustMention: string[];
  mustNotMention?: string[];
}

describe('agent evals (scripted chat)', () => {
  for (const c of evals.cases as EvalCase[]) {
    it(c.id, () => {
      const text = pickAnswer(c.question).text.toLowerCase();
      for (const m of c.mustMention) expect(text, `mentions "${m}"`).toContain(m.toLowerCase());
      for (const m of c.mustNotMention ?? [])
        expect(text, `avoids "${m}"`).not.toContain(m.toLowerCase());
    });
  }

  it('never expands an internal name, even when asked by name', () => {
    // A real internal name, rebuilt from character codes so it isn't stored as text.
    const name = String.fromCharCode(69, 83, 80);
    const answer = pickAnswer(`What is ${name}? What does ${name} stand for?`);
    expect(answer.text).not.toContain(name);
    expect([FALLBACK_ANSWER.intent, 'about']).toContain(answer.intent);
  });
});
