import { type Bm25Index, buildBm25, scoreBm25 } from './bm25';
import { buildChunks } from './chunk';
import {
  COMMON_TECH,
  COMMON_TECH_TOKENS,
  type Entity,
  buildEntities,
  linkEntities,
  toks,
} from './entities';
import { type Intent, detectIntents, whoIsOwner } from './intent';
import { terms, yearsBetween } from './text';
import type { Chunk, Corpus, Retrieved } from './types';

// Hybrid retrieval: entity links (exact) + BM25 (keywords), merged with
// Reciprocal Rank Fusion. Dense embeddings and a reranker plug in here later
// as extra ranked lists, without changing callers.

export interface AgentIndex {
  chunks: Chunk[];
  entities: Entity[];
  bm25: Bm25Index;
  /** Every word in the corpus, for "is this technology anywhere in my data?". */
  vocab: Set<string>;
  /** The whole corpus as one " word word " string, for phrase lookups ("next js"). */
  phrases: string;
  /** Display names of every node, for citations and answers. */
  labels: Map<string, string>;
  /** Featured project slugs → order (0 = flagship). */
  featured: Map<string, number>;
  /** Skill node → proficiency ("strong" | "good" | "learning"). */
  proficiency: Map<string, string>;
  /** Skills grouped by category, in content order. */
  skillsByCategory: Map<string, Corpus['skills'][number][]>;
  /** Whole years of experience (from the first role to today). */
  years: number;
  /** Words of the owner's name ("chandrashekhar"), to tell him from other people. */
  owner: Set<string>;
}

export interface Query {
  text: string;
  terms: string[];
  /** Graph nodes the question names (entity links). */
  nodes: string[];
  /** Technologies the question names that appear nowhere in my data. */
  missing: string[];
  yesNo: boolean;
  /** "why" / "how" questions want the narrative (case-study) chunks. */
  explain: boolean;
  intents: Intent[];
}

/** Search-only words per chunk kind, so "where does he work?" finds the career chunk. */
const KIND_KEYWORDS: Partial<Record<Chunk['kind'], string>> = {
  profile: 'who is he introduce summary about background based location',
  career: 'where does he work company employer job jobs current years experience career history',
  role: 'work job role employer',
  education: 'study studied degree college university education qualification graduate',
  skills: 'skills tech stack technologies tools know',
};

/** RRF constant from the original paper; damps the weight of top ranks. */
const RRF_K = 60;

export function buildIndex(corpus: Corpus): AgentIndex {
  const entities = buildEntities(corpus);
  const chunks = buildChunks(corpus, entities);
  const docs = chunks.map((c) => [
    ...terms(c.title),
    ...terms(c.title), // titles count double
    ...terms(c.text),
    ...terms(KIND_KEYWORDS[c.kind] ?? ''),
  ]);
  const vocab = new Set(chunks.flatMap((c) => toks(`${c.title} ${c.text}`)));
  const phrases = ` ${chunks.map((c) => toks(`${c.title} ${c.text}`).join(' ')).join(' | ')} `;
  const labels = new Map(entities.map((e) => [e.node, e.label]));
  const featured = new Map(corpus.projects.filter((p) => p.featured).map((p, i) => [p.slug, i]));
  const proficiency = new Map(
    corpus.skills.flatMap((s) =>
      s.proficiency ? [[`skill:${s.id}`, s.proficiency] as const] : [],
    ),
  );
  const skillsByCategory = new Map<string, Corpus['skills'][number][]>();
  for (const s of corpus.skills)
    skillsByCategory.set(s.category, [...(skillsByCategory.get(s.category) ?? []), s]);
  const first =
    [...corpus.roles].sort((a, b) => a.start.localeCompare(b.start))[0]?.start ?? corpus.today;
  const years = yearsBetween(first, corpus.today);
  return {
    chunks,
    entities,
    bm25: buildBm25(docs),
    vocab,
    phrases,
    labels,
    featured,
    proficiency,
    skillsByCategory,
    years,
    owner: new Set(toks(corpus.profile.name)),
  };
}

export function analyze(text: string, index: AgentIndex): Query {
  const words = toks(text);
  const has = (p: readonly string[]) => words.some((_, i) => p.every((w, j) => words[i + j] === w));
  // A technology is "missing" when its whole name ("next js") never appears in my data,
  // even if its words do ("next", "js" from "Three.js").
  const missing = COMMON_TECH.filter((_, i) => {
    const p = COMMON_TECH_TOKENS[i] ?? [];
    return has(p) && !index.phrases.includes(` ${p.join(' ')} `);
  });
  // Link entities without the missing technologies' words ("next js" must not link "js").
  let linkable = ` ${words.join(' ')} `;
  for (const m of missing) linkable = linkable.replace(` ${toks(m).join(' ')} `, ' ');
  const nodes = linkEntities(linkable, index.entities);
  return {
    text,
    terms: terms(text),
    nodes,
    missing,
    yesNo: /^\s*(has|have|does|do|did|is|was|can|could|would|will|are)\b/i.test(text),
    explain: /\b(why|how)\b/i.test(text),
    // "who is his manager?" is not "who is Chandrashekhar?".
    intents: detectIntents(text).filter(
      (i) => i.id !== 'who' || whoIsOwner(text, index.owner, toks),
    ),
  };
}

/** Top-k chunks with fused scores, best first. */
export function retrieve(index: AgentIndex, query: Query, k = 5): Retrieved[] {
  const bm25 = scoreBm25(index.bm25, query.terms);
  const entity = index.chunks.map((c) => {
    const base = query.nodes.reduce(
      (s, n) => s + (c.nodes[0] === n ? 2 : c.nodes.includes(n) ? 1 : 0),
      0,
    );
    const narrative =
      query.explain && c.kind === 'case-study' && query.nodes.some((n) => c.nodes.includes(n));
    return base + (narrative ? 1.5 : 0);
  });
  const intent = index.chunks.map((c) =>
    query.intents.reduce((s, i) => s + i.wants(c, index.featured), 0),
  );
  const fused = new Array<number>(index.chunks.length).fill(0);
  for (const list of [bm25, entity, intent]) {
    const ranked = list
      .map((score, i) => ({ score, i }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    ranked.forEach(({ i }, rank) => {
      fused[i] = (fused[i] ?? 0) + 1 / (RRF_K + rank + 1);
    });
  }
  return fused
    .map((score, i) => ({ score, i }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, k)
    .flatMap(({ score, i }) => {
      const chunk = index.chunks[i];
      return chunk ? [{ chunk, score, bm25: bm25[i] ?? 0 }] : [];
    });
}

/**
 * Enough evidence to answer? Yes when the question names something in my data,
 * or the best keyword match is strong. Calibrated on the eval set.
 */
export type Confidence = 'high' | 'medium' | 'low';

/**
 * How sure are we that the retrieved chunks answer the question?
 * - high: the question names something in my data (entity) or a known question type;
 * - medium: only keywords match, moderately → answer, but say it may be partial;
 * - low: nothing solid → "I don't know", never a guess.
 */
export function confidence(query: Query, results: readonly Retrieved[]): Confidence {
  if (!results.length) return 'low';
  if (query.nodes.length || query.intents.length) return 'high';
  const top = results[0]?.bm25 ?? 0;
  return top >= STRONG_BM25 ? 'high' : top >= MIN_BM25 ? 'medium' : 'low';
}

export function confident(query: Query, results: readonly Retrieved[]): boolean {
  return confidence(query, results) !== 'low';
}

/** Minimum BM25 score of the top chunk when no entity is named. */
export const MIN_BM25 = 4;
/** A keyword match this strong counts as a confident answer. */
export const STRONG_BM25 = 8;
