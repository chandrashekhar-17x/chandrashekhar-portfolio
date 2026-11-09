// robots.txt and sitemap.xml, generated from the routes + content (pure functions).

export const STATIC_PATHS = ['/', '/work', '/graph', '/lab', '/resume', '/journal'] as const;

export function robotsTxt(siteUrl: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

export function sitemapXml(
  siteUrl: string,
  projectSlugs: readonly string[],
  lastmod: string,
): string {
  const paths = [...STATIC_PATHS, ...projectSlugs.map((s) => `/work/${s}`)];
  const urls = paths
    .map((p) => {
      const loc = escapeXml(siteUrl + (p === '/' ? '/' : p));
      const priority = p === '/' ? '1.0' : p.startsWith('/work/') ? '0.8' : '0.6';
      return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><priority>${priority}</priority></url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => `&#${String(c.charCodeAt(0))};`);
}
