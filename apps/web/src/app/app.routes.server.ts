import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { firstValueFrom } from 'rxjs';

import { ContentRepository } from './core/content/content-repository';

// How each route renders on the server.
// Prerender = static HTML at build time (fast, cacheable). Phase 2 switches
// content pages to RenderMode.Server once data comes from the live API.
const staticPages = ['', 'work', 'lab', 'graph', 'journal', 'resume'];

export const serverRoutes: ServerRoute[] = [
  ...staticPages.map((path): ServerRoute => ({ path, renderMode: RenderMode.Prerender })),
  {
    path: 'work/:slug',
    renderMode: RenderMode.Prerender,
    // One static page per project in content/.
    async getPrerenderParams() {
      const projects = await firstValueFrom(inject(ContentRepository).projects());
      return projects.map((p) => ({ slug: p.slug }));
    },
  },
  // Anything else: render on request and answer with HTTP 404.
  // (Every real route must be listed above, or it would get a 404 too.)
  { path: '**', renderMode: RenderMode.Server, status: 404 },
];
