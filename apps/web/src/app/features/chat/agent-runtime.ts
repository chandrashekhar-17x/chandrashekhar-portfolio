import {
  type AgentIndex,
  type Answer,
  type ContentFiles,
  ask,
  buildIndex,
  caseStudyFile,
  corpusFromContent,
} from '@portfolio/agent';
import about from '@content/data/about.json';
import education from '@content/data/education.json';
import experience from '@content/data/experience.json';
import lab from '@content/data/lab.json';
import profile from '@content/data/profile.json';
import projects from '@content/data/projects.json';
import skills from '@content/data/skills.json';
import resumeHtml from '@content/resume/resume.html';

import { toYearMonth } from '../../core/time/duration';

// The portfolio agent (packages/agent) running in the browser. This module is a
// lazy chunk: it is downloaded the first time someone asks a question, together
// with the case studies and the resume text it indexes. No server, no API key.

const files = { profile, skills, experience, education, projects, about, lab } as ContentFiles;

let index: Promise<AgentIndex> | undefined;

/** Builds the index once per page (a few ms), then reuses it. */
export function agentIndex(): Promise<AgentIndex> {
  index ??= (async () => {
    const studies = await Promise.all(
      files.projects.projects.map(async (p) => {
        const file = caseStudyFile(p.body);
        const mod = (await import(`../../../../../../content/projects/${file}.md`)) as {
          default: string;
        };
        return [p.slug, mod.default] as const;
      }),
    );
    return buildIndex(corpusFromContent(files, new Map(studies), resumeHtml, toYearMonth()));
  })();
  return index;
}

export async function answer(question: string): Promise<Answer> {
  return ask(await agentIndex(), question).answer;
}
