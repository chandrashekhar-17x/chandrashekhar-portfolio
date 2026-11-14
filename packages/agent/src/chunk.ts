import { type Entity, linkEntities } from './entities';
import { resumeChunks } from './resume';
import { rangeLabel, stripMarkdown, yearsBetween } from './text';
import type { Chunk, Corpus } from './types';

// Turns content/ + the resume into small, citable chunks. Each chunk names the
// graph nodes it is about, so an answer built from it can light those nodes up.

/** Longest chunk in words; longer sections are split at paragraph boundaries. */
const MAX_WORDS = 120;

const sentence = (t: string) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);
const uniq = (xs: readonly string[]) => [...new Set(xs)];

export function buildChunks(corpus: Corpus, entities: readonly Entity[]): Chunk[] {
  const chunks: Chunk[] = [
    ...profileChunks(corpus),
    ...careerChunks(corpus),
    ...educationChunks(corpus),
    ...skillChunks(corpus),
    ...projectChunks(corpus),
    ...caseStudyChunks(corpus, entities),
    ...aboutChunks(corpus),
    ...(corpus.resumeHtml ? resumeChunks(corpus.resumeHtml, entities) : []),
  ];
  return chunks.map((c) => ({ ...c, text: sentence(c.text.replace(/\s+/g, ' ')) }));
}

function profileChunks({ profile: p }: Corpus): Chunk[] {
  const out: Chunk[] = [
    {
      id: 'profile:summary',
      kind: 'profile',
      title: `Who is ${p.name}?`,
      text: `${p.name} is a ${p.title} based in ${p.location}. ${sentence(p.headline)} ${p.shortBio ?? ''}`,
      nodes: ['hub:frontend'],
    },
  ];
  p.bio.forEach((para, i) => {
    out.push({
      id: `profile:bio-${String(i + 1)}`,
      kind: 'profile',
      title: 'About him',
      text: para,
      nodes: [],
    });
  });
  if (p.roles?.length) {
    out.push({
      id: 'profile:builds',
      kind: 'profile',
      title: 'What he builds',
      text: `He builds ${p.roles.join(', ')}.`,
      nodes: [],
    });
  }
  return out;
}

function careerChunks(c: Corpus): Chunk[] {
  const orgName = new Map(c.organizations.map((o) => [o.id, o.name]));
  const roles = [...c.roles].sort((a, b) => b.start.localeCompare(a.start));
  const first = roles.at(-1)?.start ?? c.today;
  const years = yearsBetween(first, c.today);
  const label = (r: (typeof roles)[number]) =>
    `${r.employmentType === 'internship' ? `${r.title} Intern` : r.title} at ${orgName.get(r.org) ?? r.org}`;
  const intern = roles.find((r) => r.employmentType === 'internship');

  const out: Chunk[] = [
    {
      id: 'career:overview',
      kind: 'career',
      title: 'Experience overview',
      text:
        `He has ${String(years)}+ years of experience, counted from ${rangeLabel(first).split(' – ')[0] ?? first}` +
        (intern ? `, including an internship (${rangeLabel(intern.start, intern.end)})` : '') +
        `. Roles: ${roles
          .map(
            (r) => `${label(r)}, ${r.location?.split(',')[0] ?? ''}, ${rangeLabel(r.start, r.end)}`,
          )
          .join('; ')}.`,
      nodes: uniq(roles.map((r) => `org:${r.org}`)),
    },
  ];
  for (const r of roles) {
    const highlights = (r.highlights ?? []).map((h) => sentence(h.text)).join(' ');
    out.push({
      id: `role:${r.org}:${r.start}`,
      kind: 'role',
      title: label(r),
      text:
        `${label(r)} (${[r.employmentType, r.workplace].filter(Boolean).join(', ')}), ` +
        `${r.location ?? ''}, ${rangeLabel(r.start, r.end)}. ${r.summary ? sentence(r.summary) : ''} ${highlights}`,
      nodes: uniq([
        `org:${r.org}`,
        ...(r.highlights ?? []).flatMap((h) => (h.project ? [`project:${h.project}`] : [])),
        ...(r.skills ?? []).map((s) => `skill:${s}`),
      ]),
    });
  }
  return out;
}

function educationChunks(c: Corpus): Chunk[] {
  return c.education.map((e) => ({
    id: `edu:${e.id}`,
    kind: 'education' as const,
    title: 'Education',
    text:
      `He studied ${e.degree}${e.field ? ` in ${e.field}` : ''} at ${e.institute} ` +
      `(${e.shortName}), ${String(e.start)}–${String(e.end ?? 'present')}.`,
    nodes: [`edu:${e.id}`, ...(e.skills ?? []).map((s) => `skill:${s}`)],
  }));
}

const LEVEL: Record<string, string> = {
  strong: 'strong (production experience)',
  good: 'good',
  learning: 'learning now (growing, not production experience yet)',
};

function skillChunks(c: Corpus): Chunk[] {
  const byCat = new Map<string, Corpus['skills'][number][]>();
  for (const s of c.skills) byCat.set(s.category, [...(byCat.get(s.category) ?? []), s]);
  const strong = c.skills.filter((s) => s.proficiency === 'strong');
  const overview: Chunk = {
    id: 'skills:overview',
    kind: 'skills',
    title: 'Key skills',
    text: `His strongest skills (production experience): ${strong.map((s) => s.name).join(', ')}.`,
    nodes: strong.map((s) => `skill:${s.id}`),
  };
  return [
    overview,
    ...[...byCat].map(([cat, skills]) => {
      const parts = Object.keys(LEVEL)
        .map((lvl) => [lvl, skills.filter((s) => s.proficiency === lvl)] as const)
        .filter(([, list]) => list.length)
        .map(([lvl, list]) => `${LEVEL[lvl] ?? lvl}: ${list.map((s) => s.name).join(', ')}`);
      const concepts = skills.filter((s) => !s.proficiency);
      if (concepts.length)
        parts.push(`applied in his work: ${concepts.map((s) => s.name).join(', ')}`);
      return {
        id: `skills:${cat}`,
        kind: 'skills' as const,
        title: `${cat[0]?.toUpperCase() ?? ''}${cat.slice(1)} skills`,
        text: parts
          .map(sentence)
          .map((s) => s[0]?.toUpperCase() + s.slice(1))
          .join(' '),
        nodes: [`hub:${cat}`, ...skills.map((s) => `skill:${s.id}`)],
      };
    }),
  ];
}

function projectChunks(c: Corpus): Chunk[] {
  const orgName = new Map(c.organizations.map((o) => [o.id, o.name]));
  return c.projects.map((p) => {
    const meta = [
      p.type === 'professional' ? 'professional project' : 'personal project',
      p.org ? `at ${orgName.get(p.org) ?? p.org}` : '',
      p.period ?? '',
      p.status ? `status: ${p.status}` : '',
    ].filter(Boolean);
    return {
      id: `project:${p.slug}`,
      kind: 'project' as const,
      title: p.title,
      text:
        `${p.title} (${meta.join(', ')}). ${sentence(p.summary)}` +
        (p.role ? ` His role: ${sentence(p.role)}` : '') +
        (p.tags?.length ? ` Built with ${p.tags.join(', ')}.` : ''),
      nodes: uniq([`project:${p.slug}`, ...(p.skills ?? []).map((s) => `skill:${s}`)]),
      url: `/work/${p.slug}`,
    };
  });
}

/** One chunk per "## " section of each case study (split further when long). */
function caseStudyChunks(c: Corpus, entities: readonly Entity[]): Chunk[] {
  const out: Chunk[] = [];
  for (const p of c.projects) {
    const md = c.caseStudies.get(p.slug);
    if (!md) continue;
    const body = md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
    for (const section of body.split(/^## /m).slice(1)) {
      const [heading = '', ...rest] = section.split('\n');
      const pieces = splitWords(rest.join('\n'));
      pieces.forEach((text, i) => {
        const slug = heading
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        out.push({
          id: `case:${p.slug}#${slug}${pieces.length > 1 ? `-${String(i + 1)}` : ''}`,
          kind: 'case-study',
          title: `${p.title}: ${heading.trim()}`,
          text,
          nodes: uniq([
            `project:${p.slug}`,
            ...linkEntities(text, entities).filter((n) => n.startsWith('skill:')),
          ]),
          url: `/work/${p.slug}`,
        });
      });
    }
  }
  return out;
}

/** Plain text in pieces of at most MAX_WORDS, cut at paragraph / list-item breaks. */
export function splitWords(md: string): string[] {
  const blocks = md
    .split(/\n\s*\n|\n(?=\s*(?:[-*+]|\d+\.)\s)/)
    .map(stripMarkdown)
    .filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const b of blocks) {
    const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
    if (cur && words(cur) + words(b) > MAX_WORDS) {
      out.push(cur);
      cur = b;
    } else {
      cur = cur ? `${cur} ${b}` : b;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function aboutChunks(c: Corpus): Chunk[] {
  const out: Chunk[] = (c.about ?? []).map((a) => ({
    id: `about:${a.id}`,
    kind: 'about' as const,
    title: a.title,
    text: `${a.title}: ${a.summary}`,
    nodes: (a.skills ?? []).map((s) => `skill:${s}`),
  }));
  if (c.learning?.length) {
    out.push({
      id: 'about:learning',
      kind: 'about',
      title: 'What he is learning',
      text: `He is currently learning, in order: ${c.learning.join(', ')}.`,
      nodes: ['hub:backend', 'hub:ai'],
    });
  }
  return out;
}
