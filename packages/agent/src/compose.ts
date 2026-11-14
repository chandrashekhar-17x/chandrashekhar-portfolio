import { idf } from './bm25';
import { toks } from './entities';
import type { AgentIndex, Query } from './retrieve';
import { sentences, terms } from './text';
import type { Chunk, Retrieved } from './types';

// Picks the sentences of an extractive answer.
//
// 1. Lead: a "direct" chunk, i.e. the data-to-text summary of exactly what was asked
//    (career overview, education, a named project or company). It is generated from
//    structured content, so it is complete and correct by construction.
// 2. Fill: Maximal Marginal Relevance (MMR). Each next sentence must add question
//    words or named things not covered yet, so the answer grows in facts, not in
//    repetition. "Why/how" questions prefer sentences that give a reason.

const MAX_SENTENCES = 4;
const MAX_WORDS = 110;
/** Chunks the fill step reads (same as retrieval hands over). */
const POOL = 6;

/** Chunk kinds that prove use (a project, a job, the resume) beat skill lists. */
const EVIDENCE = new Set<Chunk['kind']>(['project', 'case-study', 'resume', 'role', 'career']);
const LISTY = new Set<Chunk['kind']>(['skills', 'about']);
const REASON = /\b(because|for|so that|instead|to avoid|which means|so it|so the)\b/i;
/** "I + verb" can't be rewritten safely ("I build" → "he build"), so such sentences are skipped. */
const FIRST_PERSON = /\bI\b(?!['\u2019])/;

/** My data is partly written in first person; answers talk about him. */
export function thirdPerson(text: string): string {
  return text
    .replace(/\bI['\u2019]m\b/g, "he's")
    .replace(/\bI['\u2019]ve\b/g, "he's")
    .replace(/\bmyself\b/gi, 'himself')
    .replace(/\bmine\b/gi, 'his')
    .replace(/\bme\b/g, 'him')
    .replace(/\bmy\b/g, 'his')
    .replace(/\bMy\b/g, 'His')
    .replace(/^he's/, "He's");
}

export interface Picked {
  text: string;
  chunk: Chunk;
}

/** Sentences that read as prose: not diagram fragments, not over-long lists. */
function readable(text: string): boolean {
  const words = text.split(/\s+/).length;
  return words <= 60 && (text.match(/·/g) ?? []).length < 2 && /[.!?]$/.test(text);
}

/** The chunk that answers the question directly, if any (index into results). */
export function directChunk(index: AgentIndex, q: Query, results: readonly Retrieved[]): number {
  const byIntent = results.findIndex((r) =>
    q.intents.some((i) => i.wants(r.chunk, index.featured) >= 3),
  );
  if (byIntent >= 0) return byIntent;
  // A named project or company: its summary chunk leads. Not for yes/no about a
  // skill ("Has he used Three.js?"), where evidence sentences answer better.
  const subject = q.nodes.find((n) => n.startsWith('project:') || n.startsWith('org:'));
  if (!subject) return -1;
  return results.findIndex(
    (r) =>
      r.chunk.nodes[0] === subject && (r.chunk.kind === 'project' || r.chunk.kind === 'career'),
  );
}

export function compose(index: AgentIndex, q: Query, results: readonly Retrieved[]): Picked[] {
  const direct = directChunk(index, q, results);
  const names = q.nodes.map((n) => ({
    node: n,
    forms: (index.entities.find((e) => e.node === n)?.names ?? []).map(
      (x) => ` ${toks(x).join(' ')} `,
    ),
  }));
  const skillsAsked = q.intents.some((i) => i.id === 'skills');

  const picked: Picked[] = [];
  let words = 0;
  const take = (text: string, chunk: Chunk) => {
    picked.push({ text: thirdPerson(text), chunk });
    words += text.split(/\s+/).length;
  };

  // 1. Lead with the direct chunk (whole, it is short structured text).
  const lead = results[direct]?.chunk;
  if (lead) for (const s of sentences(lead.text)) if (words < MAX_WORDS) take(s, lead);

  // 2. MMR fill: what is still uncovered?
  const covered = new Set(picked.flatMap((p) => terms(p.text)));
  const coveredNodes = new Set(
    names
      .filter((n) =>
        picked.some((p) => n.forms.some((f) => ` ${toks(p.text).join(' ')} `.includes(f))),
      )
      .map((n) => n.node),
  );
  const pool = results.slice(0, POOL).flatMap((r, rank) =>
    r.chunk === lead
      ? []
      : sentences(r.chunk.text)
          .filter(readable)
          // Tokenise once per sentence; the MMR loop below reuses it every round.
          .map((text) => ({
            text,
            r,
            rank,
            words: new Set(terms(text)),
            flat: ` ${toks(text).join(' ')} `,
          })),
  );

  // Never quote "I'm…" from the bio in a third-person answer, unless nothing else exists.
  const notFirstPerson = pool.filter((c) => !FIRST_PERSON.test(c.text));
  if (notFirstPerson.length) pool.splice(0, pool.length, ...notFirstPerson);

  while (picked.length < MAX_SENTENCES && pool.length) {
    let best = -1;
    let bestScore = 0;
    pool.forEach((c, i) => {
      const newTerms = q.terms.filter((t) => !covered.has(t) && c.words.has(t));
      const newNodes = names.filter(
        (n) => !coveredNodes.has(n.node) && n.forms.some((f) => c.flat.includes(f)),
      );
      const gain = newTerms.reduce((s, t) => s + idf(index.bm25, t), 0) + 2 * newNodes.length;
      if (gain <= 0) return;
      const kind = c.r.chunk.kind;
      const score =
        gain +
        1.5 / (1 + c.rank) +
        (q.yesNo && EVIDENCE.has(kind) ? 1 : 0) +
        ((LISTY.has(kind) || c.r.chunk.id.startsWith('resume:skills')) && !skillsAsked ? -3 : 0) +
        (q.explain && REASON.test(c.text) ? 1.5 : 0) +
        (FIRST_PERSON.test(c.text) ? -1.5 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    const next = pool[best];
    if (!next) break;
    pool.splice(best, 1);
    const n = next.text.split(/\s+/).length;
    if (picked.length && words + n > MAX_WORDS) continue;
    take(next.text, next.r.chunk);
    for (const t of next.words) covered.add(t);
    for (const nm of names)
      if (nm.forms.some((f) => next.flat.includes(f))) coveredNodes.add(nm.node);
  }
  return picked;
}
