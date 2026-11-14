import { beforeAll, describe, expect, it } from 'vitest';

import { askWithLlm, buildIndex, type AgentIndex, type LlmClient } from '../src';
import { loadCorpus } from './corpus';

// The LLM step with fake models: a faithful one, a hallucinating one, a broken one.

let index: AgentIndex;
beforeAll(() => {
  index = buildIndex(loadCorpus());
});

const fake = (reply: string): LlmClient & { calls: number } => {
  const llm = {
    calls: 0,
    complete: () => {
      llm.calls += 1;
      return Promise.resolve(reply);
    },
  };
  return llm;
};

const WHY = 'Why build a custom CAD editor instead of a library?';

describe('askWithLlm', () => {
  it('uses a faithful model answer, without the [n] markers, citing its sources', async () => {
    const llm = fake(
      'Existing approaches could not render text, patterns and tables accurately or handle his JSON domain data [1], so he built a custom editor [2].',
    );
    const t = await askWithLlm(index, WHY, llm);
    expect(t.route).toBe('llm');
    expect(t.answer.text).not.toMatch(/\[\d\]/);
    expect(t.answer.citations).toContain('project:custom-cad-editor');
  });

  it('rejects an answer with a made-up number and falls back to the extractive answer', async () => {
    const t = await askWithLlm(index, WHY, fake('He evaluated 7 libraries over 18 months [1].'));
    expect(t.route).toBe('llm-rejected');
    expect(t.verdict?.reason).toMatch(/number not in sources/);
    expect(t.answer.text).not.toContain('18 months');
  });

  it('rejects technologies that are not in his data', async () => {
    const t = await askWithLlm(index, WHY, fake('He rebuilt it with React and Unity [1].'));
    expect(t.route).toBe('llm-rejected');
    expect(t.answer.text).not.toContain('React');
  });

  it('rejects first person and "not in sources" replies', async () => {
    expect((await askWithLlm(index, WHY, fake('I built my own editor [1].'))).route).toBe(
      'llm-rejected',
    );
    expect((await askWithLlm(index, WHY, fake('NOT_IN_SOURCES'))).route).toBe('llm-rejected');
  });

  it('never sends tool, policy or unknown questions to the model', async () => {
    const llm = fake('should not be used');
    for (const q of [
      'When did he join Vassar Labs?',
      'Who are his clients?',
      'Does he know Rust?',
      'who is mahesh',
    ]) {
      const t = await askWithLlm(index, q, llm);
      expect(t.route, q).toBe('deterministic');
    }
    expect(llm.calls).toBe(0);
  });

  it('falls back when the model errors', async () => {
    const broken: LlmClient = { complete: () => Promise.reject(new Error('GPU lost')) };
    const t = await askWithLlm(index, WHY, broken);
    expect(t.route).toBe('llm-error');
    expect(t.answer.kind).toBe('answer');
  });
});
