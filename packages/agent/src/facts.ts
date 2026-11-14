import { type Range, overlaps, toMonth } from './time';
import type { Corpus } from './types';

// Structured facts: roles and projects with exact dates. The "tools" (career,
// projects) answer from these, so dates, filters and lists are exact, not
// guessed from text. This is what an LLM agent calls; it also works without one.

export interface RoleFact {
  org: string;
  orgName: string;
  /** "Software Engineer" or "Software Engineer Intern". */
  title: string;
  start: string;
  end?: string;
}

export interface ProjectFact {
  slug: string;
  title: string;
  /** Undated or planned projects have no start and never match a time filter. */
  start?: string;
  end?: string;
  skills: readonly string[];
  org?: string;
  status?: string;
}

export interface Facts {
  roles: RoleFact[]; // oldest first
  projects: ProjectFact[];
  today: string;
  /** Where he is based ("Hyderabad, Telangana, India"). */
  location: string;
}

export function buildFacts(c: Corpus): Facts {
  const orgName = new Map(c.organizations.map((o) => [o.id, o.name]));
  const roles = [...c.roles]
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((r) => ({
      org: r.org,
      orgName: orgName.get(r.org) ?? r.org,
      title: r.employmentType === 'internship' ? `${r.title} Intern` : r.title,
      start: r.start,
      ...(r.end ? { end: r.end } : {}),
    }));
  const projects = c.projects.map((p) => {
    const dated = p.dates && p.status !== 'planned';
    return {
      slug: p.slug,
      title: p.title,
      skills: p.skills ?? [],
      ...(p.org ? { org: p.org } : {}),
      ...(p.status ? { status: p.status } : {}),
      ...(dated && p.dates ? { start: toMonth(p.dates.start, 'start') } : {}),
      ...(dated && p.dates?.end ? { end: toMonth(p.dates.end, 'end') } : {}),
    };
  });
  return { roles, projects, today: c.today, location: c.profile.location };
}

export function rolesIn(f: Facts, r: Range): RoleFact[] {
  return f.roles.filter((x) => overlaps(x.start, x.end, r, f.today));
}

export function rolesAt(f: Facts, org: string): RoleFact[] {
  return f.roles.filter((x) => x.org === org);
}

export function currentRole(f: Facts): RoleFact | undefined {
  return f.roles.filter((x) => !x.end).at(-1) ?? f.roles.at(-1);
}

export interface ProjectFilter {
  range?: Range;
  skill?: string; // skill id
  org?: string;
}

export function projectsWhere(f: Facts, q: ProjectFilter): ProjectFact[] {
  return f.projects.filter(
    (p) =>
      (!q.range || (p.start !== undefined && overlaps(p.start, p.end, q.range, f.today))) &&
      (!q.skill || p.skills.includes(q.skill)) &&
      (!q.org || p.org === q.org),
  );
}
