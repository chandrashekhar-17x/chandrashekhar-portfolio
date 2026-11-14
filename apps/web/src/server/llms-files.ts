// /llms.txt and /llms-full.txt (https://llmstxt.org): my portfolio in plain
// Markdown, so AI assistants and agents can read it without running JavaScript.
// Pure functions over content/; the Express server and the static export serve them.

export interface LlmsInput {
  siteUrl: string;
  profile: {
    name: string;
    title: string;
    headline: string;
    bio: readonly string[];
    locationShort: string;
    links: readonly { label: string; url: string }[];
  };
  projects: readonly {
    slug: string;
    title: string;
    summary: string;
    type: string;
    period?: string;
    status?: string;
  }[];
  roles: readonly {
    org: string;
    title: string;
    start: string;
    end?: string;
    employmentType?: string;
  }[];
  organizations: readonly { id: string; name: string }[];
  skills: readonly { name: string; proficiency?: string }[];
}

export function llmsTxt(d: LlmsInput): string {
  const { siteUrl: site, profile: p } = d;
  const orgName = new Map(d.organizations.map((o) => [o.id, o.name]));
  const project = (x: LlmsInput['projects'][number]) => {
    const meta = [x.period, x.status === 'planned' ? 'planned' : x.status].filter(Boolean);
    const suffix = meta.length ? ` (${meta.join(', ')})` : '';
    return `- [${x.title}](${site}/work/${x.slug})${suffix}: ${x.summary}`;
  };
  const strong = d.skills.filter((s) => s.proficiency === 'strong').map((s) => s.name);

  return lines([
    `# ${p.name}`,
    '',
    `> ${p.title}, ${p.locationShort}. ${p.headline}`,
    '',
    ...p.bio.flatMap((para) => [para, '']),
    '',
    `Contact: the form at ${site}/#contact (no public email).`,
    '',
    '## Experience',
    '',
    ...[...d.roles]
      .sort((a, b) => b.start.localeCompare(a.start))
      .map(
        (r) =>
          `- ${r.employmentType === 'internship' ? 'Intern' : r.title}, ${orgName.get(r.org) ?? r.org} (${r.start} to ${r.end ?? 'present'})`,
      ),
    '',
    '## Professional work',
    '',
    'Office projects use public titles; client and internal names are left out on purpose.',
    '',
    ...d.projects.filter((x) => x.type === 'professional').map(project),
    '',
    '## Personal projects',
    '',
    ...d.projects.filter((x) => x.type !== 'professional').map(project),
    '',
    '## Strongest skills',
    '',
    strong.join(', '),
    '',
    '## Pages',
    '',
    `- [Home](${site}/): hero, knowledge graph, work, AI lab, experience, contact`,
    `- [Résumé](${site}/resume): PDF plus a version generated from this site's data`,
    `- [Knowledge graph](${site}/graph): skills, projects and jobs as one graph`,
    `- [Full text](${site}/llms-full.txt): this file plus every case study`,
    '',
    '## Optional',
    '',
    ...p.links.map((l) => `- [${l.label}](${l.url})`),
  ]);
}

/** llms.txt plus every case study, front matter removed. */
export function llmsFullTxt(d: LlmsInput, caseStudies: ReadonlyMap<string, string>): string {
  const studies = d.projects
    .filter((x) => caseStudies.has(x.slug))
    .map((x) => {
      const body = stripFrontMatter(caseStudies.get(x.slug) ?? '');
      return `# Case study: ${x.title}\n\nSource: ${d.siteUrl}/work/${x.slug}\n\n${demote(body)}`;
    });
  return lines([llmsTxt(d).trimEnd(), '', ...studies.flatMap((s) => ['---', '', s.trim(), ''])]);
}

export function stripFrontMatter(md: string): string {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

/** "## X" → "### X", so each study stays under its own "# Case study" heading. */
function demote(md: string): string {
  return md.replace(/^(#{1,5}) /gm, '#$1 ');
}

function lines(all: readonly string[]): string {
  return all.join('\n').replace(/\n{3,}/g, '\n\n') + '\n';
}
