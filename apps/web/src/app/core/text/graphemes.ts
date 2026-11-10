const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/**
 * Splits text into user-perceived characters. Plain [...str] splits code points,
 * which breaks combined characters (e.g. Hindi letters with vowel signs, emoji).
 */
export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}
