import { toks } from './entities';
import { CONTACT_URL, UNKNOWN } from './answer';
import { WHO } from './intent';
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
    test: /\b(clients?|customers?)\b|\b(compan(y|ies)|organi[sz]ations?)\b.*\bprojects?\b.*\bfor\b/i,
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

/** Words that refer to him (or to nobody in particular), never to another person. */
const HIM = new Set([
  'he',
  'him',
  'his',
  'this',
  'that',
  'the',
  'a',
  'an',
  'your',
  'you',
  'my',
  'our',
  'it',
]);
const NOT_NAMES = new Set([
  'it',
  'that',
  'what',
  'he',
  'who',
  'there',
  'let',
  'here',
  'where',
  'how',
  'today',
  'everyone',
]);
const POSSESSIVE = /\b([a-z]+)['\u2019]s\b/gi;

/**
 * "Who is Mahesh?" / "Rahul's projects": a person who isn't Chandrashekhar and isn't
 * in his data. Answering with his profile would mislead, so say so plainly.
 */
function otherPerson(q: Query, index: AgentIndex): string | null {
  const known = (w: string) => index.owner.has(w) || index.vocab.has(w);
  const who = WHO.exec(q.text)?.[1];
  if (who) {
    const words = toks(who);
    const aboutHim =
      !words.length || HIM.has(words[0] ?? '') || words.some((w) => index.owner.has(w));
    if (!aboutHim && words.length <= 3 && !words.every(known)) return who.trim();
  }
  for (const [, name = ''] of q.text.matchAll(POSSESSIVE)) {
    const w = name.toLowerCase();
    if (!NOT_NAMES.has(w) && !known(w)) return name;
  }
  return null;
}

/** "who is his manager / wife / friend": people in his life (not facts like his employer). */
const RELATION =
  /^(his|her)\s+(manager|boss|wife|husband|girlfriend|boyfriend|partner|father|mother|dad|mom|parents?|brother|sister|siblings?|friends?|best friend|team ?lead|lead|colleagues?|mentor|family|son|daughter|kids?|children|referen(ce|ces)|referees?|hr|recruiter|teacher|professor|guide)\b/i;

/** Requests to do a task (write code, a poem, a recipe) rather than ask about him. */
const TASK =
  /^\s*(please\s+)?(write|create|generate|build me|make me|code|solve|translate|calculate|compute|compose|draft|recommend|suggest|book|summari[sz]e the news|give me a recipe|help me with my)\b/i;

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
  if (TASK.test(q.text)) {
    return policy(
      "I only answer questions about Chandrashekhar's work, using his portfolio and resume, so I can't do that task. Ask me about his skills, projects or experience.",
    );
  }
  // "who is his manager / wife / team lead?": people in his life aren't in his data.
  if (RELATION.test(WHO.exec(q.text)?.[1] ?? '')) {
    return { kind: 'unknown', text: UNKNOWN, citations: [], urls: [CONTACT_URL], sources: [] };
  }
  const person = otherPerson(q, index);
  if (person) {
    const name = person.replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      ...policy(
        `I don't know who ${name} is. I only answer questions about Chandrashekhar, using his portfolio and resume. Did you mean him? Say "yes" and I'll tell you who he is.`,
      ),
      suggest: 'Who is Chandrashekhar?',
      aboutOther: name,
    };
  }
  return null;
}
