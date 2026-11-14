import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

import experienceJson from '@content/data/experience.json';
import profileJson from '@content/data/profile.json';
import projectsJson from '@content/data/projects.json';
import skillsJson from '@content/data/skills.json';
import { SITE_ORIGIN } from './app/core/seo/site-origin.gen';
import { LlmsInput, llmsFullTxt, llmsTxt } from './server/llms-files';
import { robotsTxt, sitemapXml } from './server/seo-files';

// Express server that serves static files and renders Angular pages (SSR).
// Security headers (CSP with nonces, HSTS) are added in Phase 9.
const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.disable('x-powered-by');

// Public origin for absolute URLs (PLACEHOLDER domain until one is bought).
const siteUrl = SITE_ORIGIN;
const builtAt = new Date().toISOString().slice(0, 10);

app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(robotsTxt(siteUrl));
});

app.get('/sitemap.xml', (_req, res) => {
  const slugs = projectsJson.projects.map((p) => p.slug);
  res.type('application/xml').send(sitemapXml(siteUrl, slugs, builtAt));
});

// Plain-Markdown portfolio for AI assistants (llmstxt.org).
const llms: LlmsInput = {
  siteUrl,
  profile: profileJson,
  projects: projectsJson.projects,
  roles: experienceJson.roles,
  organizations: experienceJson.organizations,
  skills: skillsJson.skills,
};

app.get('/llms.txt', (_req, res) => {
  res.type('text/markdown').send(llmsTxt(llms));
});

app.get('/llms-full.txt', (_req, res, next) => {
  caseStudies()
    .then((studies) => res.type('text/markdown').send(llmsFullTxt(llms, studies)))
    .catch(next);
});

/** Case-study markdown by slug (bundled as text: angular.json → loader ".md"). */
async function caseStudies(): Promise<Map<string, string>> {
  const entries = await Promise.all(
    projectsJson.projects.map(async (p) => {
      const file = p.body.replace(/^projects\//, '').replace(/\.md$/, '');
      const mod = (await import(`../../../content/projects/${file}.md`)) as { default: string };
      return [p.slug, mod.default] as const;
    }),
  );
  return new Map(entries);
}

// Hashed build files can be cached for a year.
app.use(express.static(browserDistFolder, { maxAge: '1y', index: false, redirect: false }));

// Everything else is rendered by Angular.
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then(async (response) => {
      if (response) {
        await writeResponseToNodeResponse(response, res);
      } else {
        next();
      }
    })
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = Number(process.env['PORT'] ?? 4000);
  app.listen(port, (error) => {
    if (error) throw error;
    console.log(`SSR server listening on http://localhost:${String(port)}`);
  });
}

// Used by the Angular CLI dev-server and by serverless hosts.
export const reqHandler = createNodeRequestHandler(app);
