import { idf } from './bm25';
import { toks } from './entities';
import type { AgentIndex, Query } from './retrieve';
import { sentences, terms } from './text';
import type { Answer, Retrieved } from './types';

// Extractive answers: the reply is made of my own sentences from the best chunks,
// so it can't contain a fact that isn't in my data. Always available (no model,
// no network): the fallback whenever the LLM is off, over budget or unverified.

const MAX_SENTENCES = 3;
const MAX_WORDS = 85;
const MAX_CITATIONS = 6;
/** A word this rare (BM25 idf) is specific enough to confirm a yes/no question. */
const RARE_IDF = 3;

export const UNKNOWN =
  "That isn't in his profile, so I won't guess. You can ask him directly through the contact form, or ask about his skills, projects or experience.";

/** "a", "a and b", "a, b and c". */
export function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`;
}

function missingNote(q: Query): string {
  if (!q.missing.length) return '';
  const names = q.missing.map((m) => m.replace(/^\w/, (c) => c.toUpperCase()));
  return `${joinAnd(names)} ${names.length > 1 ? "aren't" : "isn't"} in his profile, so I won't guess.`;
}

export function unknown(q: Query): Answer {
  const note = missingNote(q);
  return {
    kind: 'unknown',
    text: note
      ? `That isn't in his profile: ${note.replace(/, so I won't guess\.$/, '.')} Ask about his skills, projects or experience instead.`
      : UNKNOWN,
    citations: [],
    urls: [],
    sources: [],
  };
}

/** Near-duplicate sentences (same fact said twice in different chunks). */
function similar(a: string, b: string): boolean {
  const x = new Set(terms(a));
  const y = new Set(terms(b));
  const shared = [...x].filter((t) => y.has(t)).length;
  return shared / Math.max(1, Math.min(x.size, y.size)) > 0.6;
}

/** List-like chunks (skill lists) read badly as answers unless skills were asked for. */
const LISTY = new Set(['skills', 'about']);

/** Sentences that read as prose: not diagram fragments, not over-long lists. */
function readable(text: string): boolean {
  const words = text.split(/\s+/).length;
  return words <= 60 && (text.match(/·/g) ?? []).length < 2 && /[.!?]$/.test(text);
}

/**
 * "Yes." only when the asked skill/project is in the answer AND he really has it.
 * Skills he is still learning get an honest "He is learning …" instead.
 */
function yesLead(
  index: AgentIndex,
  q: Query,
  answerNodes: readonly string[],
  text: string,
): string {
  const asked = q.nodes.filter((n) => answerNodes.includes(n));
  if (!asked.length) {
    // No named skill: "Yes" only if the question's rarest word is in the answer
    // (e.g. "Keycloak" in "integrated Keycloak with role-based access control").
    const rarest = [...q.terms].sort((a, b) => idf(index.bm25, b) - idf(index.bm25, a))[0];
    return rarest && idf(index.bm25, rarest) > RARE_IDF && terms(text).includes(rarest)
      ? 'Yes. '
      : '';
  }
  const learning = asked.filter((n) => index.proficiency.get(n) === 'learning');
  if (learning.length && learning.length === asked.filter((n) => index.proficiency.has(n)).length) {
    const names = learning.map((n) => index.labels.get(n) ?? n);
    return `He is learning ${joinAnd(names)} now (growing, not production experience yet). `;
  }
  return 'Yes. ';
}

interface Candidate {
  text: string;
  chunkRank: number;
  position: number;
  score: number;
  /** Matches the question itself (words or named things), not just rank bonuses. */
  relevant: boolean;
}

export function extractive(index: AgentIndex, q: Query, results: readonly Retrieved[]): Answer {
  const qTerms = new Set(q.terms);
  const names = q.nodes.flatMap((n) => index.entities.find((e) => e.node === n)?.names ?? []);

  // The chunk an intent targets directly (e.g. the career overview for "where
  // does he work?") leads the answer.
  const direct = results.findIndex((r) =>
    q.intents.some((i) => i.wants(r.chunk, index.featured) >= 3),
  );

  const candidates: Candidate[] = results.slice(0, 4).flatMap((r, chunkRank) =>
    sentences(r.chunk.text)
      .filter(readable)
      .map((text, position) => {
        const words = new Set(terms(text));
        const lexical = [...qTerms].reduce(
          (s, t) => s + (words.has(t) ? idf(index.bm25, t) : 0),
          0,
        );
        const sentenceToks = ` ${toks(text).join(' ')} `;
        const entity = names.filter((n) => sentenceToks.includes(` ${toks(n).join(' ')} `)).length;
        const listy = LISTY.has(r.chunk.kind) && !q.intents.some((i) => i.id === 'skills') ? -2 : 0;
        const firstPerson = /\b(I|I'm|I've|me|my)\b/.test(text) ? -1.5 : 0;
        const lead = chunkRank === direct ? 6 - position : 0;
        const score = lexical + 1.5 * entity + 2 / (1 + chunkRank) + listy + firstPerson + lead;
        return {
          text,
          chunkRank,
          position,
          score,
          relevant: lexical + entity > 0 || chunkRank === direct,
        };
      }),
  );

  const picked: Candidate[] = [];
  let words = 0;
  for (const c of [...candidates].sort((a, b) => b.score - a.score)) {
    const n = c.text.split(/\s+/).length;
    if (picked.length >= MAX_SENTENCES || (picked.length && words + n > MAX_WORDS)) continue;
    if (!c.relevant || picked.some((p) => similar(p.text, c.text))) continue;
    picked.push(c);
    words += n;
  }
  picked.sort(
    (a, b) =>
      Number(b.chunkRank === direct) - Number(a.chunkRank === direct) ||
      a.chunkRank - b.chunkRank ||
      a.position - b.position,
  );

  const used = [...new Set(picked.map((p) => p.chunkRank))]
    .map((i) => results[i])
    .filter((r): r is Retrieved => !!r);
  const answerNodes = used.flatMap((r) => r.chunk.nodes);
  const citations = [
    ...new Set([
      ...q.nodes.filter((n) => answerNodes.includes(n)),
      ...used.map((r) => r.chunk.nodes[0]).filter((n): n is string => !!n),
    ]),
  ].slice(0, MAX_CITATIONS);

  if (!picked.length) return unknown(q);
  const text = picked.map((p) => p.text).join(' ');
  const lead = q.yesNo ? yesLead(index, q, answerNodes, text) : '';
  const note = missingNote(q);
  return {
    kind: 'answer',
    text: `${lead}${text}${note ? ` ${note}` : ''}`.trim(),
    citations,
    urls: [...new Set(used.flatMap((r) => (r.chunk.url ? [r.chunk.url] : [])))],
    sources: used.map((r) => r.chunk),
  };
}
