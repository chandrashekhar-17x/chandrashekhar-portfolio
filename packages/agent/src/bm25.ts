// BM25 keyword ranking (the classic search-engine formula). A query term scores
// high in a chunk when it is frequent there but rare across all chunks.
// k1 controls term-frequency saturation, b controls length normalisation.

const K1 = 1.2;
const B = 0.75;

export interface Bm25Index {
  /** Term → [doc index, term count] pairs. */
  postings: Record<string, [number, number][]>;
  lengths: number[];
  avgLength: number;
}

export function buildBm25(docs: readonly (readonly string[])[]): Bm25Index {
  const postings: Record<string, [number, number][]> = {};
  docs.forEach((terms, i) => {
    const tf = new Map<string, number>();
    for (const t of terms) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const [t, n] of tf) (postings[t] ??= []).push([i, n]);
  });
  const lengths = docs.map((d) => d.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  return { postings, lengths, avgLength };
}

/** Inverse document frequency (BM25+ style, never negative). */
export function idf(index: Bm25Index, term: string): number {
  const n = index.lengths.length;
  const df = index.postings[term]?.length ?? 0;
  return Math.log(1 + (n - df + 0.5) / (df + 0.5));
}

/** Score of every doc for the query terms (0 when no term matches). */
export function scoreBm25(index: Bm25Index, query: readonly string[]): number[] {
  const scores = new Array<number>(index.lengths.length).fill(0);
  for (const term of new Set(query)) {
    const list = index.postings[term];
    if (!list) continue;
    const w = idf(index, term);
    for (const [doc, tf] of list) {
      const len = index.lengths[doc] ?? 0;
      const norm = tf + K1 * (1 - B + (B * len) / index.avgLength);
      scores[doc] = (scores[doc] ?? 0) + (w * tf * (K1 + 1)) / norm;
    }
  }
  return scores;
}
