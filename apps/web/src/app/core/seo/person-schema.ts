import { Experience, Profile, Project, Skill } from '../content/content.types.gen';

/**
 * schema.org structured data for the home page: who I am (Person) and the site
 * (WebSite). Search engines use it for rich results; AI crawlers read it too.
 * Placeholder employers are left out so we never publish sample data as fact.
 */
export function personSchema(
  siteUrl: string,
  profile: Profile,
  skills: readonly Skill[],
  experience: Experience,
  projects: readonly Project[],
): object {
  const realOrgs = experience.organizations.filter((o) => !o.placeholder && o.kind === 'company');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: profile.name,
        url: siteUrl,
        description: profile.headline,
        jobTitle: 'Frontend Engineer',
        address: { '@type': 'PostalAddress', addressCountry: profile.location },
        sameAs: profile.links.filter((l) => l.url.startsWith('https://')).map((l) => l.url),
        knowsAbout: skills.map((s) => s.name),
        ...(realOrgs.length
          ? { worksFor: realOrgs.map((o) => ({ '@type': 'Organization', name: o.name })) }
          : {}),
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
