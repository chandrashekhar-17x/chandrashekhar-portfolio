import type { Chunk } from './types';

// Intent routing: common question shapes ("where does he work?", "what's his
// biggest project?") that keywords alone rank badly, mapped to the chunks that
// answer them. Used as one more ranked list in retrieval, and as evidence that
// the question is about my profile.

export interface Intent {
  id: string;
  test: RegExp;
  /** Does this chunk answer the intent? Earlier matches rank higher. */
  wants: (chunk: Chunk, featured: ReadonlyMap<string, number>) => number;
}

export const INTENTS: readonly Intent[] = [
  {
    id: 'work',
    test: /\b(where|which company|employer|company|job|jobs|currently)\b.*\b(work|works|working|employed|job)\b|\bemployer\b|\bwork experience\b/i,
    wants: (c) => (c.id === 'career:overview' ? 3 : c.kind === 'role' ? 2 : 0),
  },
  {
    id: 'years',
    test: /\b(how (many|much)|years?|experience|senior|junior)\b.*\b(years?|experience)\b/i,
    wants: (c) => (c.id === 'career:overview' ? 3 : c.kind === 'role' ? 1 : 0),
  },
  {
    id: 'education',
    test: /\b(study|studied|degree|college|university|education|qualification|graduat\w*)\b/i,
    wants: (c) => (c.kind === 'education' ? 3 : 0),
  },
  {
    id: 'who',
    test: /\bwho (is|'s)\b|\babout (him|chandrashekhar)\b|\bintroduce\b|\bsummary\b|\bbackground\b/i,
    wants: (c) => (c.id === 'profile:summary' ? 3 : c.kind === 'profile' ? 2 : 0),
  },
  {
    id: 'location',
    test: /\bwhere\b.*\b(based|live|lives|located|from|stay)\b|\b(hometown|native place)\b|\b(what|which) (city|town|country|place)\b|\blive in\b|\blocation\b/i,
    wants: (c) => (c.id === 'profile:summary' ? 3 : 0),
  },
  {
    id: 'skills',
    test: /\b(key |main |core |top )?skills?\b|\btech stack\b|\btechnologies\b|\bgood at\b|\bstrengths?\b/i,
    wants: (c) => (c.id === 'skills:overview' ? 3 : c.id.startsWith('skills:') ? 1 : 0),
  },
  {
    id: 'flagship',
    test: /\b(biggest|flagship|proud\w*|best|main|largest|most (important|impressive|complex))\b.*\b(project|work|thing)\b/i,
    wants: (c, featured) => {
      const slug = c.nodes[0]?.replace(/^project:/, '') ?? '';
      const order = featured.get(slug);
      if (!c.nodes[0]?.startsWith('project:') || order === undefined) return 0;
      // The first featured project is the flagship; later ones rank lower.
      return (c.kind === 'project' ? 3 : c.id.endsWith('#tl-dr') ? 2 : 0) / (1 + order);
    },
  },
  {
    id: 'learning',
    test: /\b(learning|learn|growing|studying now|next|upskill\w*)\b/i,
    wants: (c) =>
      c.id === 'about:learning' ? 3 : c.id === 'skills:ai' || c.id === 'skills:backend' ? 2 : 0,
  },
  {
    id: 'lead',
    test: /\b(led|lead|leader\w*|leading|manage\w*|mentor\w*|own(ed|ership)?)\b/i,
    wants: (c) =>
      /#leadership/.test(c.id) ? 3 : c.nodes.includes('skill:technical-direction') ? 1 : 0,
  },
  {
    id: 'this-site',
    test: /\b(this (site|website|portfolio)|how is (ai|this) (used|built)|built this|tech behind)\b/i,
    wants: (c) => (c.nodes[0] === 'project:portfolio-rag-agent' ? 2 : 0),
  },
];

export function detectIntents(question: string): Intent[] {
  return INTENTS.filter((i) => i.test.test(question));
}
