import { Education, Experience, Project } from '../../core/content/content.types.gen';
import { KnowledgeGraph } from '../../core/content/build-graph';

/**
 * Career time machine: when did each graph node enter my story?
 * Months are "YYYY-MM" strings (they sort correctly as text).
 */

export type Month = string;
/** The slider's last stop: today, including undated and planned work. */
export const NOW = 'now';
/** A month or NOW (both strings; NOW never collides with "YYYY-MM"). */
export type When = string;

export interface CareerData {
  projects: readonly Project[];
  experience: Experience;
  education: readonly Education['education'][number][];
}

export interface Milestone {
  at: Month;
  text: string;
}

/** "2024" → "2024-01"; "2024-07" stays. */
export function toMonth(value: string | number): Month {
  const v = String(value);
  return v.length === 4 ? `${v}-01` : v;
}

/** Every month from `from` to `to`, inclusive. */
export function monthsBetween(from: Month, to: Month): Month[] {
  const out: Month[] = [];
  let [y, m] = from.split('-').map(Number) as [number, number];
  const end = to;
  for (;;) {
    const cur = `${String(y)}-${String(m).padStart(2, '0')}`;
    if (cur > end) break;
    out.push(cur);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/**
 * Start month per node id. Missing id = always shown (hubs, topics);
 * null = only "now" (undated or planned work, and skills nothing dated uses yet).
 * Skills start with the first dated project, job or degree that uses them.
 */
export function nodeStarts(graph: KnowledgeGraph, data: CareerData): Map<string, Month | null> {
  const starts = new Map<string, Month | null>();
  for (const p of data.projects) {
    starts.set(
      `project:${p.slug}`,
      p.dates && p.status !== 'planned' ? toMonth(p.dates.start) : null,
    );
  }
  for (const r of data.experience.roles) {
    const id = `org:${r.org}`;
    const prev = starts.get(id);
    if (!prev || r.start < prev) starts.set(id, r.start);
  }
  for (const e of data.education) starts.set(`edu:${e.id}`, toMonth(e.start));

  const dated = (id: string) => starts.get(id) ?? null;
  for (const n of graph.nodes) {
    if (n.kind !== 'skill' && n.kind !== 'concept') continue;
    let first: Month | null = null;
    for (const l of graph.links) {
      const other = l.source === n.id ? l.target : l.target === n.id ? l.source : null;
      // Only dated sources count (not other skills, or dates would chain).
      const at = other && /^(project|org|edu):/.test(other) ? dated(other) : null;
      if (at && (!first || at < first)) first = at;
    }
    starts.set(n.id, first);
  }
  return starts;
}

/** Ids not born yet at `when` (hidden by the time machine). */
export function futureAt(starts: ReadonlyMap<string, Month | null>, when: When): Set<string> {
  const hidden = new Set<string>();
  if (when === NOW) return hidden;
  for (const [id, start] of starts) if (start === null || start > when) hidden.add(id);
  return hidden;
}

/** Story beats for the caption: degree, jobs and dated projects, oldest first. */
export function milestones(data: CareerData): Milestone[] {
  const orgName = new Map(data.experience.organizations.map((o) => [o.id, o.name]));
  const out: Milestone[] = [
    ...data.education.map((e) => ({
      at: toMonth(e.start),
      text: `Starts ${e.degree.replace(/\s*\(.*\)/, '')} at ${e.shortName}`,
    })),
    ...data.experience.roles.map((r) => ({
      at: r.start,
      text: `${r.employmentType === 'internship' ? 'Intern' : r.title} at ${orgName.get(r.org) ?? r.org}`,
    })),
    ...data.projects
      .filter((p) => p.dates && p.status !== 'planned')
      .map((p) => ({ at: toMonth(p.dates?.start ?? ''), text: p.title })),
  ];
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

/** The latest milestone at or before `when`. */
export function milestoneAt(all: readonly Milestone[], when: When): Milestone | null {
  if (when === NOW) return null;
  return all.filter((m) => m.at <= when).at(-1) ?? null;
}
