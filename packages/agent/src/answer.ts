import { idf } from './bm25';
import { compose } from './compose';
import { linkEntities } from './entities';
import type { AgentIndex, Confidence, Query } from './retrieve';
import { terms } from './text';
import type { Answer, Retrieved } from './types';

// Extractive answers: the reply is made of my own sentences (see compose.ts), so
// it can't contain a fact that isn't in my data. Always available (no model, no
// network): the fallback whenever the LLM is off, over budget or unverified.

const MAX_CITATIONS = 6;
/** A word this rare (BM25 idf) is specific enough to confirm a yes/no question. */
const RARE_IDF = 3;

/** Where every "can't answer" points: the contact form on the home page. */
export const CONTACT_URL = '/#contact';
export const REACH_OUT = 'Please reach out to Chandrashekhar directly through the contact form.';

export const UNKNOWN = `I don't know: that isn't in his profile, and I won't guess. ${REACH_OUT}`;

/** "a", "a and b", "a, b and c". */
export function joinAnd(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`;
}

function missingNote(q: Query): string {
  if (!q.missing.length) return '';
  const names = q.missing.map((m) => m.replace(/^\w/, (c) => c.toUpperCase()));
  if (names.length === 1) {
    return `${names[0] ?? ''} isn't in his profile, so I won't guess; please reach out to Chandrashekhar to ask about it.`;
  }
  return `that isn't in his profile: ${joinAnd(names)} aren't listed in his skills, projects or resume, so I won't guess; please reach out to Chandrashekhar to ask about them.`;
}

export function unknown(q: Query): Answer {
  const note = missingNote(q);
  return {
    kind: 'unknown',
    text: note ? `I don't know of any experience with that: ${note}` : UNKNOWN,
    citations: [],
    urls: [CONTACT_URL],
    sources: [],
  };
}

/**
 * "Yes, he has worked with X." only when X is in the answer AND he really has it.
 * Skills he is still learning get an honest "He is learning X" instead.
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
  const skills = asked.filter((n) => index.proficiency.has(n));
  const learning = skills.filter((n) => index.proficiency.get(n) === 'learning');
  const label = (ns: readonly string[]) => joinAnd(ns.map((n) => index.labels.get(n) ?? n));
  if (learning.length && learning.length === skills.length) {
    return `He is learning ${label(learning)} now (growing, not production experience yet). `;
  }
  const used = skills.filter((n) => !learning.includes(n));
  return used.length ? `Yes, he has worked with ${label(used)}. ` : 'Yes. ';
}

export function extractive(
  index: AgentIndex,
  q: Query,
  results: readonly Retrieved[],
  level: Confidence = 'high',
): Answer {
  const picked = compose(index, q, results);
  if (!picked.length) return unknown(q);

  const used = [...new Set(picked.map((p) => p.chunk))];
  const text = picked.map((p) => p.text).join(' ');
  // What the answer is about: its chunks' nodes plus anything it names in the text.
  const answerNodes = [...used.flatMap((c) => c.nodes), ...linkEntities(text, index.entities)];
  const citations = [
    ...new Set([
      ...q.nodes.filter((n) => answerNodes.includes(n)),
      ...used.map((c) => c.nodes[0]).filter((n): n is string => !!n),
    ]),
  ].slice(0, MAX_CITATIONS);

  const lead = q.yesNo ? yesLead(index, q, answerNodes, text) : '';
  const origin =
    /\b(from|hometown|native|born|grew up)\b/i.test(q.text) &&
    q.intents.some((i) => i.id === 'location')
      ? " His hometown isn't in his profile, only where he is based; please reach out to Chandrashekhar if you need it."
      : '';
  const note = `${missingNote(q)}${origin}`.trim();
  // Only keywords matched: answer, but be clear it may not be the whole story.
  const partial = level === 'medium';
  const hedge = partial ? 'This may only partly answer your question. From his profile: ' : '';
  const outro = partial
    ? ` For details, ${REACH_OUT[0]?.toLowerCase() ?? ''}${REACH_OUT.slice(1)}`
    : '';
  const urls = [...new Set(used.flatMap((c) => (c.url ? [c.url] : [])))];
  return {
    kind: 'answer',
    text: `${hedge}${lead}${text}${note ? ` ${note}` : ''}${outro}`.trim(),
    citations,
    urls: partial || q.missing.length ? [...urls, CONTACT_URL] : urls,
    sources: used,
  };
}
