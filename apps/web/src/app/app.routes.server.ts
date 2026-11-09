import { RenderMode, ServerRoute } from '@angular/ssr';

// How each route renders on the server. Prerender for now (static HTML at build time).
// Phase 2 switches content pages to RenderMode.Server once data comes from the API.
export const serverRoutes: ServerRoute[] = [{ path: '**', renderMode: RenderMode.Prerender }];
