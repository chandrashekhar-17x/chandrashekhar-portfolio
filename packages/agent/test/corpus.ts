// Loads the real content/ folder (Node only) into the agent's Corpus shape.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { type ContentFiles, caseStudyFile, corpusFromContent } from '../src/content';
import type { Corpus } from '../src/types';

const root = fileURLToPath(new URL('../../../content/', import.meta.url));
const json = <T>(path: string): T => JSON.parse(readFileSync(root + path, 'utf8')) as T;
const text = (path: string): string => readFileSync(root + path, 'utf8');

/** Fixed "today" so experience years and evals never drift with the calendar. */
export const TODAY = '2026-11';

export function loadCorpus(today = TODAY): Corpus {
  const files: ContentFiles = {
    profile: json('data/profile.json'),
    skills: json('data/skills.json'),
    experience: json('data/experience.json'),
    education: json('data/education.json'),
    projects: json('data/projects.json'),
    about: json('data/about.json'),
    lab: json('data/lab.json'),
  };
  const studies = new Map(
    files.projects.projects.map((p) => [p.slug, text(`projects/${caseStudyFile(p.body)}.md`)]),
  );
  return corpusFromContent(files, studies, text('resume/resume.html'), today);
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
  /** Written before tuning; reported separately to measure generalisation. */
  holdout?: boolean;
}

export function loadEvals(): EvalCase[] {
  return json<{ cases: EvalCase[] }>('evals/agent-evals.json').cases;
}
