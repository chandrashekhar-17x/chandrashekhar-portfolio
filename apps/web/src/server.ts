import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

// Express server that serves static files and renders Angular pages (SSR).
// Security headers (CSP with nonces, HSTS) are added in Phase 9.
const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.disable('x-powered-by');

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
