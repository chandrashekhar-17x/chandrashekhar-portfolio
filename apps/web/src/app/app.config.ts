import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideContent } from './core/content/provide-content';
import { provideChat } from './features/chat/provide-chat';

// Root providers shared by browser and server.
// Angular 22 defaults we rely on: zoneless change detection, incremental hydration
// (for @defer (hydrate on …) blocks) and the fetch-based HttpClient backend.
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route params arrive as component inputs (e.g. /work/:slug → slug input).
      withComponentInputBinding(),
      // "/#work" scrolls to the section; back/forward restores scroll position.
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideClientHydration(),
    provideHttpClient(),
    provideContent(),
    provideChat(),
  ],
};
