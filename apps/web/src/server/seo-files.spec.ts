import { robotsTxt, sitemapXml } from './seo-files';

describe('SEO files', () => {
  it('robots.txt allows the site, blocks /admin and points to the sitemap', () => {
    const txt = robotsTxt('https://example.dev');
    expect(txt).toContain('Allow: /');
    expect(txt).toContain('Disallow: /admin');
    expect(txt).toContain('Sitemap: https://example.dev/sitemap.xml');
  });

  it('sitemap lists static pages and every case study', () => {
    const xml = sitemapXml('https://example.dev', ['cad-editor'], '2026-11-09');
    expect(xml).toContain('<loc>https://example.dev/</loc>');
    expect(xml).toContain('<loc>https://example.dev/work/cad-editor</loc>');
    expect(xml).toContain('<lastmod>2026-11-09</lastmod>');
    expect(xml).toContain('<loc>https://example.dev/recruiter</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(8);
  });
});
