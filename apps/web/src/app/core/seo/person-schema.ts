import { EducationEntry, Experience, Profile, Project, Skill } from '../content/content.types.gen';

/** Skills named in the Person JSON-LD (profile-data §10): the ones recruiters search for. */
const KNOWS_ABOUT = [
  'angular',
  'typescript',
  'threejs',
  'webgl',
  'pdfjs',
  'sse',
  'python',
  'fastapi',
];

export interface PersonSchemaInput {
  siteUrl: string;
  profile: Profile;
  skills: readonly Skill[];
  experience: Experience;
  education: readonly EducationEntry[];
  projects: readonly Project[];
}

/**
 * schema.org structured data for the home page: who I am (Person) and the site
 * (WebSite). Search engines use it for rich results; AI crawlers read it too.
 * Placeholder entries are left out so we never publish sample data as fact.
 */
export function personSchema(input: PersonSchemaInput): object {
  const { siteUrl, profile, skills, experience, education, projects } = input;
  const currentOrgIds = new Set(experience.roles.filter((r) => !r.end).map((r) => r.org));
  const worksFor = experience.organizations.filter(
    (o) => currentOrgIds.has(o.id) && !o.placeholder && o.kind === 'company',
  );
  const names = new Map(skills.map((s) => [s.id, s.name]));
  const [locality] = profile.locationShort.split(',');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: profile.name,
        url: siteUrl,
        description: profile.headline,
        jobTitle: profile.title.split(',')[0], // "Software Engineer"
        address: {
          '@type': 'PostalAddress',
          addressLocality: locality?.trim(),
          addressCountry: 'IN',
        },
        sameAs: profile.links.filter((l) => l.url.startsWith('https://')).map((l) => l.url),
        knowsAbout: KNOWS_ABOUT.map((id) => names.get(id)).filter(Boolean),
        ...(worksFor.length
          ? { worksFor: worksFor.map((o) => ({ '@type': 'Organization', name: o.name })) }
          : {}),
        alumniOf: education
          .filter((e) => !e.placeholder)
          .map((e) => ({ '@type': 'CollegeOrUniversity', name: e.institute })),
        subjectOf: projects
          .filter((p) => !p.placeholder)
          .map((p) => ({
            '@type': 'CreativeWork',
            name: p.title,
            url: `${siteUrl}/work/${p.slug}`,
          })),
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: `${profile.name} — portfolio`,
        author: { '@id': `${siteUrl}/#person` },
      },
    ],
  };
}
