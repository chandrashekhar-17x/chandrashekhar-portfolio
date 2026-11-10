import { Project } from '../content/content.types.gen';

/**
 * schema.org Article for a case study. The author points at the Person on the
 * home page (same @id), so search engines connect the two.
 */
export function articleSchema(siteUrl: string, project: Project, image: string): object {
  const url = `${siteUrl}/work/${project.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: project.title,
    description: project.summary,
    url,
    mainEntityOfPage: url,
    image: `${siteUrl}${image}`,
    keywords: project.tags.join(', '),
    author: { '@id': `${siteUrl}/#person` },
    publisher: { '@id': `${siteUrl}/#person` },
  };
}
