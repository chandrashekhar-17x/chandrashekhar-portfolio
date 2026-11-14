// Text helpers shared by indexing and querying. Both sides must use the same
// functions, or a word indexed one way is searched another way and never matches.

const STOPWORDS = new Set(
  (
    'a an and are as at be been but by can could did do does doing for from had has have he her ' +
    'him his how i if in into is it its me my of on or our she so than that the their them then ' +
    'there these they this to was we were what when where which who whom why will with would you ' +
    'your about any all also just tell know show give some more most much very there here'
  ).split(' '),
);

/** Lowercase, plain quotes/dashes, no accents. */
export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’′]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/→/g, ' ')
    .toLowerCase();
}

/**
 * Tokens keep tech spellings intact ("three.js", "c++", "r-tree") and also emit
 * their parts ("three", "js", "r", "tree"), so "threejs", "three js" and
 * "Three.js" all meet.
 */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  const raw = normalize(text).match(/[a-z0-9][a-z0-9+#.\-/&]*[a-z0-9+#]|[a-z0-9]/g) ?? [];
  for (const tok of raw) {
    const parts = tok.split(/[.\-/&]/).filter(Boolean);
    if (parts.length > 1) {
      out.push(tok, parts.join(''));
      for (const p of parts) out.push(p);
    } else {
      out.push(tok);
    }
  }
  return out;
}

/** Very light English stemming: enough for plural/verb forms of the same word. */
export function stem(word: string): string {
  if (word.length <= 4 || /[0-9+#]/.test(word)) return word;
  for (const [suffix, keep] of [
    ['ies', 'y'],
    ['ied', 'y'],
    ['ing', ''],
    ['ed', ''],
    ['es', ''],
    ['s', ''],
  ] as const) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 3) {
      return word.slice(0, -suffix.length) + keep;
    }
  }
  return word;
}

/** Search terms: tokens without stopwords, stemmed. */
export function terms(text: string): string[] {
  return tokenize(text)
    .filter((t) => !STOPWORDS.has(t))
    .map(stem);
}

/** A single-space, punctuation-free form used for phrase matching. */
export function phrase(text: string): string {
  return ` ${tokenize(text).join(' ')} `;
}

/** Split prose into sentences (keeps "e.g." and "Three.js" intact). */
export function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

/** Strip Markdown to plain prose (headings, emphasis, links, list markers, code). */
export function stripMarkdown(md: string): string {
  return (
    tablesToSentences(md)
      // Keep diagram text (it carries facts), drop the fences and box-drawing marks.
      .replace(/```[^\n]*\n([\s\S]*?)```/g, (_, code: string) =>
        code.replace(/[\u2500-\u257f\u25b2-\u25c4]+/g, ' '),
      )
      .replace(/`([^`]+)`/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s).,:;!?]|$)/g, '$1$2')

      .replace(/\s*·\s*[✗✓◐]/g, '.')
      .replace(/[✗✓◐]/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim()
  );
}

/** Markdown table rows → "cell: cell." sentences (header and separator rows dropped). */
function tablesToSentences(md: string): string {
  return md.replace(/(?:^\s*\|.*\|\s*(?:\n|$))+/gm, (block) => {
    const rows = block
      .trim()
      .split('\n')
      .map((r) =>
        r
          .trim()
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((c) => c.trim()),
      );
    const body = rows.filter((r, i) => i > 0 && !r.every((c) => /^:?-{3,}:?$/.test(c)));
    return `${body.map((r) => `${r.filter(Boolean).join(': ')}.`).join('\n')}\n`;
  });
}

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

/** "2023-08" → "Aug 2023". */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1] ?? ''} ${y ?? ''}`.trim();
}

/** "2023-08".."2023-12" → "Aug–Dec 2023"; open end → "Jan 2024 – present". */
export function rangeLabel(start: string, end?: string): string {
  if (!end) return `${monthLabel(start)} – present`;
  const [sy] = start.split('-');
  const [ey] = end.split('-');
  if (sy === ey) {
    return `${monthLabel(start).split(' ')[0] ?? ''}–${monthLabel(end)}`;
  }
  return `${monthLabel(start)} – ${monthLabel(end)}`;
}

/** Whole years between two "YYYY-MM" months. */
export function yearsBetween(start: string, end: string): number {
  const [sy = 0, sm = 1] = start.split('-').map(Number);
  const [ey = 0, em = 1] = end.split('-').map(Number);
  return Math.floor((ey * 12 + em - (sy * 12 + sm)) / 12);
}
