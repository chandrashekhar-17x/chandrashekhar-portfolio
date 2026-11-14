import { CONTACT_URL, REACH_OUT, extractive, unknown } from './answer';
import { plan, runPlan } from './plan';
import { toks } from './entities';
import { fitAnswer } from './fit';
import { guard } from './guard';
import { type AgentIndex, analyze, confidence, retrieve } from './retrieve';
import type { Answer, Retrieved } from './types';

// The whole pipeline without a language model:
// guard → analyse → retrieve → confidence (low → honest "I don't know") → extractive answer
// (medium → the answer says it may be partial and points to Chandrashekhar).
// The Pages Function adds an LLM step between retrieve and answer, and falls back to this.

export interface Trace {
  answer: Answer;
  results: Retrieved[];
  /** Milliseconds spent, for the latency budget. */
  ms: number;
}

/** Short replies that accept an offer: "yes", "sure", "ok please", "go ahead". */
const AFFIRM =
  /^\s*(y|yes|yeah|yep|yup|sure|ok|okay|please|yes please|ok please|go ahead|do it|haan|ha)\s*[.!]*\s*$/i;

export interface Context {
  /** The follow-up the previous answer offered (Answer.suggest). */
  suggest?: string;
  /** The previous question was about someone else (Answer.aboutOther). */
  lastOther?: string;
}

/** he / his / him: who they point at depends on the previous turn. */
const PRONOUN = /\b(he|his|him|he's|himself)\b/i;

export function ask(index: AgentIndex, question: string, context: Context = {}): Trace {
  if (AFFIRM.test(question)) {
    if (context.suggest) return ask(index, context.suggest);
    const t = performance.now();
    return {
      answer: {
        kind: 'smalltalk',
        text: 'Sure! What would you like to know about him: his skills, projects or experience?',
        citations: [],
        urls: [],
        sources: [],
      },
      results: [],
      ms: performance.now() - t,
    };
  }
  const t0 = performance.now();
  // After "who is Himanshu?", "what is his role?" may mean Himanshu: confirm, don't guess.
  if (
    context.lastOther &&
    PRONOUN.test(question) &&
    !toks(question).some((w) => index.owner.has(w))
  ) {
    return {
      answer: {
        kind: 'policy',
        text: `Do you mean Chandrashekhar? I don't have any information about ${context.lastOther}. Say "yes" and I'll answer about Chandrashekhar.`,
        citations: [],
        urls: [],
        sources: [],
        suggest: question,
      },
      results: [],
      ms: performance.now() - t0,
    };
  }
  const q = analyze(question, index);
  const policy = guard(q, index) ?? fitAnswer(index, q);
  if (policy) return { answer: policy, results: [], ms: performance.now() - t0 };

  // Structured questions (dates, roles, filters) → a tool over exact facts → one sentence.
  const p = plan(q, index);
  if (p) {
    const tool = runPlan(p, index);
    if (tool) return { answer: tool, results: [], ms: performance.now() - t0 };
    if (p.tool === 'projects' && p.range) {
      return {
        answer: {
          kind: 'unknown',
          text: `I don't see any dated projects ${p.range.label} in his profile. ${REACH_OUT}`,
          citations: [],
          urls: [CONTACT_URL],
          sources: [],
        },
        results: [],
        ms: performance.now() - t0,
      };
    }
  }

  const results = retrieve(index, q, 6);
  const onlyMissing = q.missing.length > 0 && q.nodes.length === 0;
  // A weak keyword match on a question that isn't about him at all ("what is the best
  // programming language?") is off-topic, not a partial answer.
  const aboutHim =
    /\b(he|him|his|he's)\b/i.test(question) || toks(question).some((w) => index.owner.has(w));
  const raw = confidence(q, results, index);
  const level = raw === 'medium' && !aboutHim ? 'low' : raw;
  const answer = onlyMissing || level === 'low' ? unknown(q) : extractive(index, q, results, level);
  return { answer, results, ms: performance.now() - t0 };
}
