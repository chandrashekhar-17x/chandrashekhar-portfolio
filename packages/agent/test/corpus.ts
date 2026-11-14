// Loads the real content/ folder (Node only) into the agent's Corpus shape.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Corpus } from '../src/types';

const root = fileURLToPath(new URL('../../../content/', import.meta.url));
const json = <T>(path: string): T => JSON.parse(readFileSync(root + path, 'utf8')) as T;
const text = (path: string): string => readFileSync(root + path, 'utf8');

/** Fixed "today" so experience years and evals never drift with the calendar. */
export const TODAY = '2026-11';

export function loadCorpus(today = TODAY): Corpus {
  const profile = json<Corpus['profile']>('data/profile.json');
  const { skills } = json<{ skills: Corpus['skills'] }>('data/skills.json');
  const exp = json<{ organizations: Corpus['organizations']; roles: Corpus['roles'] }>(
    'data/experience.json',
  );
  const { education } = json<{ education: Corpus['education'] }>('data/education.json');
  const { projects } = json<{ projects: (Corpus['projects'][number] & { body: string })[] }>(
    'data/projects.json',
  );
  const { areas } = json<{ areas: NonNullable<Corpus['about']> }>('data/about.json');
  const { timeline } = json<{ timeline: { topic: string }[] }>('data/lab.json');

  return {
    profile,
    skills,
    organizations: exp.organizations,
    roles: exp.roles,
    education,
    projects,
    about: areas,
    learning: timeline.map((t) => t.topic),
    caseStudies: new Map(projects.map((p) => [p.slug, text(p.body)])),
    resumeHtml: text('resume/resume.html'),
    today,
  };
}

export interface EvalCase {
  id: string;
  question: string;
  kind: 'answer' | 'honest-no' | 'confidential';
  mustMention?: string[];
  mustNotMention?: string[];
  /** Graph nodes that must be among the retrieved chunks' nodes (top 5). */
  expectNodes?: string[];
  agentOnly?: boolean;
}

export function loadEvals(): EvalCase[] {
  return json<{ cases: EvalCase[] }>('evals/agent-evals.json').cases;
}
