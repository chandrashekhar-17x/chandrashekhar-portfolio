import { extractive, unknown } from './answer';
import { guard } from './guard';
import { type AgentIndex, analyze, confident, retrieve } from './retrieve';
import type { Answer, Retrieved } from './types';

// The whole pipeline without a language model:
// guard → analyse → retrieve → (not enough evidence → honest "unknown") → extractive answer.
// The Pages Function adds an LLM step between retrieve and answer, and falls back to this.

export interface Trace {
  answer: Answer;
  results: Retrieved[];
  /** Milliseconds spent, for the latency budget. */
  ms: number;
}

export function ask(index: AgentIndex, question: string): Trace {
  const t0 = performance.now();
  const q = analyze(question, index);
  const policy = guard(q, index);
  if (policy) return { answer: policy, results: [], ms: performance.now() - t0 };

  const results = retrieve(index, q, 6);
  const onlyMissing = q.missing.length > 0 && q.nodes.length === 0;
  const answer = onlyMissing || !confident(q, results) ? unknown(q) : extractive(index, q, results);
  return { answer, results, ms: performance.now() - t0 };
}
