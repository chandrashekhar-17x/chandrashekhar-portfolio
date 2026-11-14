import { type Context, type Trace, ask } from './agent';
import { type LlmClient, type Verdict, buildMessages, llmAnswer, verify } from './llm';
import type { AgentIndex } from './retrieve';

// The full agent with an LLM: deterministic first, model only where it helps.
//
//   policy / tools / unknown  → returned as is (exact, instant, never sent to a model)
//   confident text retrieval  → LLM rewrites the top chunks in 1-2 sentences
//                               → verify() → shown only if every fact is in the chunks
//                               → otherwise the extractive answer (never a guess)

/** Chunks the model reads: enough context, small enough for a 1-2B model. */
const LLM_SOURCES = 4;

export type Route = 'deterministic' | 'llm' | 'llm-rejected' | 'llm-error';

export interface LlmTrace extends Trace {
  route: Route;
  verdict?: Verdict;
}

export async function askWithLlm(
  index: AgentIndex,
  question: string,
  llm: LlmClient | undefined,
  context: Context = {},
): Promise<LlmTrace> {
  const base = ask(index, question, context);
  const open =
    base.results.length > 0 &&
    base.answer.kind === 'answer' &&
    !base.answer.text.startsWith('This may only partly');
  if (!llm || !open) return { ...base, route: 'deterministic' };

  const sources = base.results.slice(0, LLM_SOURCES).map((r) => r.chunk);
  const t0 = performance.now();
  try {
    const raw = await llm.complete(buildMessages(question, sources), {
      maxTokens: 160,
      temperature: 0,
    });
    const verdict = verify(raw, question, sources, index);
    const ms = base.ms + performance.now() - t0;
    return verdict.ok
      ? { answer: llmAnswer(verdict, sources), results: base.results, ms, route: 'llm', verdict }
      : { ...base, ms, route: 'llm-rejected', verdict };
  } catch {
    return { ...base, route: 'llm-error' };
  }
}
