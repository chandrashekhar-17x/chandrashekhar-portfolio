import { CONTACT_URL, REACH_OUT } from './answer';
import { COMMON_TECH_TOKENS, linkEntities, toks } from './entities';
import type { AgentIndex } from './retrieve';
import type { Answer, Chunk } from './types';

// The LLM step for open questions ("why a custom CAD editor?"), provider-agnostic:
// WebLLM in the browser today, Workers AI or Claude later, all behind LlmClient.
// The model only rewrites retrieved chunks; verify() rejects any answer that
// mentions a name, number or date the chunks don't contain.

export interface LlmMessage {
  role: 'system' | 'user';
  content: string;
}

export interface LlmClient {
  /** Full completion text (short answers: we verify before showing anything). */
  complete(
    messages: LlmMessage[],
    opts: { maxTokens: number; temperature: number },
  ): Promise<string>;
}

/** Bump when the prompt changes (part of eval reports and future caches). */
export const PROMPT_VERSION = 'v1';

const SYSTEM = `You answer questions about Chandrashekhar, a software engineer, for visitors of his portfolio.
Rules:
- Use ONLY the numbered sources. Never add facts, names, numbers, dates or technologies that are not in them.
- Answer only what was asked, in 1-2 short sentences (max 50 words). No lists, no headings.
- Speak about him in third person ("he", "his").
- Cite sources like [1] or [2] right after the facts they support.
- If the sources do not answer the question, reply exactly: NOT_IN_SOURCES`;

export function buildMessages(question: string, sources: readonly Chunk[]): LlmMessage[] {
  const context = sources.map((c, i) => `[${String(i + 1)}] ${c.title}: ${c.text}`).join('\n');
  return [
    { role: 'system', content: SYSTEM },
    { role: 'user', content: `Sources:\n${context}\n\nQuestion: ${question}` },
  ];
}

export interface Verdict {
  ok: boolean;
  /** Why it was rejected (for eval reports). */
  reason?: string;
  text: string;
  /** Sources the answer cited ([n] markers). */
  cited: Chunk[];
}

/** Numbers, years and month-years: the facts small models most often invent. */
const NUMBERS = /\b\d+(?:[.,]\d+)?\+?\b/g;

export function verify(
  raw: string,
  question: string,
  sources: readonly Chunk[],
  index: AgentIndex,
): Verdict {
  const text = raw.trim();
  const cited = [...new Set([...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]) - 1))]
    .map((i) => sources[i])
    .filter((c): c is Chunk => !!c);
  const clean = text
    .replace(/\s*\[\d+\]/g, '')
    .replace(/\s+([.,;:])/g, '$1')
    .trim();
  const reject = (reason: string): Verdict => ({ ok: false, reason, text: clean, cited });

  if (!clean || /NOT_IN_SOURCES/.test(clean)) return reject('model says not in sources');
  if (clean.split(/\s+/).length > 70) return reject('too long');
  if (/\b(I'm|I've|my|me)\b/.test(clean)) return reject('first person');

  const evidence = ` ${toks([question, ...sources.map((c) => `${c.title} ${c.text}`)].join(' ')).join(' ')} `;
  const evidenceRaw = [question, ...sources.map((c) => c.text)].join(' ');
  for (const n of clean.match(NUMBERS) ?? []) {
    if (!evidenceRaw.includes(n.replace('+', ''))) return reject(`number not in sources: ${n}`);
  }
  // Every skill / project / company it names must be in the sources.
  for (const node of linkEntities(clean, index.entities)) {
    const names = index.entities.find((e) => e.node === node)?.tokens ?? [];
    if (!names.some((n) => evidence.includes(` ${n.join(' ')} `)))
      return reject(`entity not in sources: ${node}`);
  }
  // And no technology from outside his data ("React", "Docker").
  const words = ` ${toks(clean).join(' ')} `;
  for (const t of COMMON_TECH_TOKENS) {
    const p = ` ${t.join(' ')} `;
    if (words.includes(p) && !evidence.includes(p))
      return reject(`outside technology: ${t.join(' ')}`);
  }
  return { ok: true, text: clean, cited };
}

/** A verified LLM answer as an Answer, citing the chunks it used. */
export function llmAnswer(v: Verdict, sources: readonly Chunk[]): Answer {
  const used = v.cited.length ? v.cited : sources.slice(0, 1);
  return {
    kind: 'answer',
    text: v.text,
    citations: [...new Set(used.map((c) => c.nodes[0]).filter((n): n is string => !!n))].slice(
      0,
      6,
    ),
    urls: [...new Set(used.flatMap((c) => (c.url ? [c.url] : [])))],
    sources: [...used],
  };
}

export const LLM_UNKNOWN: Answer = {
  kind: 'unknown',
  text: `I don't know: that isn't in his profile, and I won't guess. ${REACH_OUT}`,
  citations: [],
  urls: [CONTACT_URL],
  sources: [],
};
