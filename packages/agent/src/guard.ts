import type { AgentIndex, Query } from './retrieve';
import type { Answer } from './types';

// Deterministic rules that run before retrieval. They never call a model, so
// confidentiality and injection handling can't be talked around.

export const MAX_QUESTION = 500;

const policy = (text: string, citations: string[] = [], urls: string[] = []): Answer => ({
  kind: 'policy',
  text,
  citations,
  urls,
  sources: [],
});

const RULES: readonly {
  test: RegExp;
  answer: (q: Query, index: AgentIndex) => Answer;
}[] = [
  {
    // Prompt injection / attempts to change the rules.
    test: /\b(ignore|disregard|forget)\b.{0,30}\b(instruction|rule|prompt|previous|above)|system prompt|jailbreak|you are now|pretend to be|act as\b|reveal (your|the) (prompt|instruction)/i,
    answer: () =>
      policy(
        "I only answer questions about Chandrashekhar's work, using his portfolio and resume.",
      ),
  },
  {
    test: /\b(clients?|customers?)\b/i,
    answer: () =>
      policy(
        "I don't share client or customer names. In general terms: he builds CAD and railway signalling-plan tooling, document-processing and PDF viewers, and data-extraction interfaces for enterprise products.",
        ['project:signalling-plan-editor', 'project:document-review-viewer'],
      ),
  },
  {
    test: /\b(code ?names?|internal (names?|products?|projects?)|acronyms?|abbreviations?|stands? for)\b/i,
    answer: (q, index) => {
      const project = q.nodes.find((n) => n.startsWith('project:'));
      const title = project ? index.labels.get(project) : undefined;
      return policy(
        "I can't expand internal product names or codenames; his projects are described by public titles" +
          (title ? `. Publicly, that work is "${title}".` : '.'),
        project ? [project] : [],
        project ? [`/work/${project.slice('project:'.length)}`] : [],
      );
    },
  },
  {
    test: /\b(salary|ctc|compensation|pay|age|religion|caste|married|marital|phone|mobile number|home address|email)\b/i,
    answer: () =>
      policy(
        "That's personal, so it isn't something I share. Please reach out to Chandrashekhar directly through the contact form.",
        [],
        ['/#contact'],
      ),
  },
];

const SMALLTALK =
  /^\s*(hi|hello|hey|hola|namaste|thanks|thank you|thx|ok|okay|cool|great|bye)\b[\s!.?]*$/i;

/** A policy / smalltalk answer, or null to continue to retrieval. */
export function guard(q: Query, index: AgentIndex): Answer | null {
  if (!q.text.trim()) return policy('Ask me anything about his skills, projects or experience.');
  if (q.text.length > MAX_QUESTION) {
    return policy(`Please keep questions under ${String(MAX_QUESTION)} characters.`);
  }
  if (SMALLTALK.test(q.text)) {
    return {
      kind: 'smalltalk',
      text: 'Hi! Ask me about his skills, projects, experience or how this site is built.',
      citations: [],
      urls: [],
      sources: [],
    };
  }
  for (const rule of RULES) if (rule.test.test(q.text)) return rule.answer(q, index);
  return null;
}
