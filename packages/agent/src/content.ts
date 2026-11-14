import type { Corpus } from './types';

// content/ JSON files → Corpus. Shared by the tests (read with fs) and the website
// (bundled imports), so both build the agent from exactly the same data.

export interface ContentFiles {
  profile: Corpus['profile'];
  skills: { skills: Corpus['skills'] };
  experience: { organizations: Corpus['organizations']; roles: Corpus['roles'] };
  education: { education: Corpus['education'] };
  projects: { projects: (Corpus['projects'][number] & { body: string })[] };
  about: { areas: NonNullable<Corpus['about']> };
  lab: { timeline: { topic: string }[] };
}

/** "projects/custom-cad-editor.md" → "custom-cad-editor". */
export function caseStudyFile(body: string): string {
  return body.replace(/^projects\//, '').replace(/\.md$/, '');
}

export function corpusFromContent(
  files: ContentFiles,
  caseStudies: ReadonlyMap<string, string>,
  resumeHtml: string | undefined,
  today: string,
): Corpus {
  return {
    profile: files.profile,
    skills: files.skills.skills,
    organizations: files.experience.organizations,
    roles: files.experience.roles,
    education: files.education.education,
    projects: files.projects.projects,
    about: files.about.areas,
    learning: files.lab.timeline.map((t) => t.topic),
    caseStudies,
    resumeHtml,
    today,
  };
}
