import { joinAnd } from './answer';
import { currentRole, projectsWhere, rolesAt, rolesIn, type RoleFact } from './facts';
import type { AgentIndex, Query } from './retrieve';
import { monthLabel, rangeLabel } from './text';
import { type Range, parseRange } from './time';
import type { Answer } from './types';

// Planner + tools + writer for structured questions (dates, roles, filters).
// Like an LLM agent's tool call: question → plan {tool, field, filters} → exact
// facts → ONE short sentence that answers only what was asked.

export type CareerField =
  'start' | 'end' | 'duration' | 'initial' | 'current' | 'titleAt' | 'orgAt' | 'worked';

export type Plan =
  | { tool: 'career'; field: CareerField; org?: string; range?: Range }
  | { tool: 'projects'; range?: Range; skill?: string }
  | { tool: 'location'; origin: boolean }
  | { tool: 'skill'; skills: string[] };

const PROJECTS = /\bprojects?\b|\bwork(ed|ing)? on\b|\bbuil[dt]\b/i;
const CAREER =
  /\b(join(ed|ing)?|start(ed)?|began|left|leave|quit|role|position|title|designation|job|work(ed|ing|s)?|employ\w*|company|intern\w*|tenure|how long)\b/i;

function careerField(
  text: string,
  range: Range | undefined,
  org: string | undefined,
): CareerField | null {
  const t = text.toLowerCase();
  if (/\bhow long\b|\bduration\b|\btenure\b/.test(t)) return 'duration';
  if (/\b(initial|first|starting)\b.*\b(role|position|title|job|designation)\b/.test(t))
    return 'initial';
  if (/\b(join(ed|ing)?|start(ed)?|begin|began)\b/.test(t)) return 'start';
  if (/\b(left|leave|quit|ended|until)\b/.test(t)) return 'end';
  if (/\b(role|position|title|designation)\b/.test(t)) return range ? 'titleAt' : 'current';
  if (range && /\b(where|which company|work(ed|ing)?)\b/.test(t)) return 'orgAt';
  if (org && /^\s*(has|did|was|is)\b/.test(t)) return 'worked';
  if (!range && /\bwhere\b.*\bwork|\bcurrent (job|company|employer)\b|\bwho .* employer\b/.test(t))
    return 'current';
  return null;
}

export function plan(q: Query, index: AgentIndex): Plan | null {
  if (q.nodes.some((n) => n.startsWith('project:'))) return null; // a named project: its own answer
  const intent = (id: string) => q.intents.some((i) => i.id === id);
  if (intent('location') && !intent('education')) {
    return { tool: 'location', origin: /\b(from|hometown|native|born|grew up)\b/i.test(q.text) };
  }
  const range = parseRange(q.text, index.facts.today) ?? undefined;
  const skill = q.nodes.find((n) => n.startsWith('skill:'))?.slice('skill:'.length);
  const org = q.nodes.find((n) => n.startsWith('org:'))?.slice('org:'.length);

  // "Has he used Three.js?" → yes/no from proficiency + where he used it.
  const skills = q.nodes.filter((n) => n.startsWith('skill:'));
  if (q.yesNo && skills.length && !org && !range && !q.missing.length) {
    return { tool: 'skill', skills: skills.map((n) => n.slice('skill:'.length)) };
  }
  if (PROJECTS.test(q.text) && !q.yesNo && (range || skill) && !org) {
    return { tool: 'projects', ...(range ? { range } : {}), ...(skill ? { skill } : {}) };
  }
  if (!org && !CAREER.test(q.text)) return null;
  const field = careerField(q.text, range, org);
  return field
    ? { tool: 'career', field, ...(org ? { org } : {}), ...(range ? { range } : {}) }
    : null;
}

const answer = (text: string, citations: string[], urls: string[] = []): Answer => ({
  kind: 'answer',
  text,
  citations,
  urls,
  sources: [],
});

const span = (r: RoleFact) => rangeLabel(r.start, r.end);

/** Runs the plan against the facts and writes one sentence; null = no data (caller says so). */
export function runPlan(p: Plan, index: AgentIndex): Answer | null {
  const f = index.facts;
  if (p.tool === 'location') {
    const note = p.origin
      ? " His hometown isn't in his profile; please reach out to Chandrashekhar if you need it."
      : '';
    return answer(`He is based in ${f.location}.${note}`, []);
  }
  if (p.tool === 'skill') {
    const name = (id: string) => index.labels.get(`skill:${id}`) ?? id;
    const learning = p.skills.filter((id) => index.proficiency.get(`skill:${id}`) === 'learning');
    const known = p.skills.filter((id) => !learning.includes(id));
    const used = f.projects.filter(
      (x) => x.status !== 'planned' && known.some((id) => x.skills.includes(id)),
    );
    const short = (t: string) => t.split(',')[0] ?? t;
    const parts: string[] = [];
    if (known.length) {
      parts.push(
        used.length
          ? `Yes, he has used ${joinAnd(known.map(name))} in ${joinAnd(used.slice(0, 3).map((x) => short(x.title)))}.`
          : `Yes, ${joinAnd(known.map(name))} ${known.length > 1 ? 'are' : 'is'} in his skills.`,
      );
    }
    if (learning.length) {
      parts.push(
        `He is learning ${joinAnd(learning.map(name))} now (growing, not production experience yet).`,
      );
    }
    return answer(
      parts.join(' '),
      [...p.skills.map((id) => `skill:${id}`), ...used.slice(0, 3).map((x) => `project:${x.slug}`)],
      used.slice(0, 3).map((x) => `/work/${x.slug}`),
    );
  }
  if (p.tool === 'projects') {
    const list = projectsWhere(f, {
      ...(p.range ? { range: p.range } : {}),
      ...(p.skill ? { skill: p.skill } : {}),
    });
    if (!list.length) return null;
    const what = p.skill ? `using ${index.labels.get(`skill:${p.skill}`) ?? p.skill}` : '';
    const when = p.range?.label ?? '';
    // Short titles ("Custom CAD Viewer & Editor"), and say when work isn't built yet.
    const names = joinAnd(
      list.map(
        (x) => `${x.title.split(',')[0] ?? x.title}${x.status === 'planned' ? ' (planned)' : ''}`,
      ),
    );
    return answer(
      `Projects ${[what, when].filter(Boolean).join(' ')}: ${names}.`.replace(/\s+:/, ':'),
      list.map((x) => `project:${x.slug}`).slice(0, 6),
      list.map((x) => `/work/${x.slug}`).slice(0, 3),
    );
  }

  const roles = p.org ? rolesAt(f, p.org) : f.roles;
  if (!roles.length) return null;
  const first = roles[0] as RoleFact;
  const last = roles.at(-1) as RoleFact;
  const org = (r: RoleFact) => r.orgName;
  const cite = [...new Set(roles.map((r) => `org:${r.org}`))];

  switch (p.field) {
    case 'start':
      return answer(
        p.org
          ? `He joined ${org(first)} in ${monthLabel(first.start)}.`
          : `He started his career in ${monthLabel(first.start)}, at ${org(first)}.`,
        [`org:${first.org}`],
      );
    case 'end':
      return last.end
        ? answer(`He worked at ${org(last)} until ${monthLabel(last.end)}.`, [`org:${last.org}`])
        : answer(`He still works at ${org(last)} (since ${monthLabel(first.start)}).`, [
            `org:${last.org}`,
          ]);
    case 'duration':
      return answer(
        last.end
          ? `He was at ${org(first)} from ${monthLabel(first.start)} to ${monthLabel(last.end)}.`
          : `He has been at ${org(first)} since ${monthLabel(first.start)}.`,
        cite,
      );
    case 'initial':
      return answer(
        `His first role${p.org ? ` at ${org(first)}` : ''} was ${first.title} (${span(first)}).`,
        [`org:${first.org}`],
      );
    case 'worked':
      return answer(
        `Yes, he worked at ${org(first)} (${rangeLabel(first.start, last.end)}).`,
        cite,
      );
    case 'current': {
      const now = p.org ? last : currentRole(f);
      if (!now) return null;
      return answer(
        now.end
          ? `His last role was ${now.title} at ${org(now)} (${span(now)}).`
          : `He is a ${now.title} at ${org(now)} (since ${monthLabel(now.start)}).`,
        [`org:${now.org}`],
      );
    }
    case 'titleAt':
    case 'orgAt': {
      const hits = p.range ? rolesIn(f, p.range).filter((r) => !p.org || r.org === p.org) : [];
      if (!hits.length || !p.range) return null;
      const parts =
        p.field === 'orgAt'
          ? [...new Set(hits.map(org))]
          : hits.map((r) => `${r.title} at ${org(r)} (${span(r)})`);
      const verb = p.field === 'orgAt' ? 'he worked at' : 'he was';
      const label = p.range.label;
      return answer(
        `${label[0]?.toUpperCase() ?? ''}${label.slice(1)}, ${verb} ${joinAnd(parts)}.`,
        [...new Set(hits.map((r) => `org:${r.org}`))],
      );
    }
  }
}
