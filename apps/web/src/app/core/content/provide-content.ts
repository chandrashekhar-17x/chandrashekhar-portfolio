import { Provider } from '@angular/core';

import { API_ORIGIN } from '../seo/site-origin.gen';
import { ContentRepository } from './content-repository';
import { HttpContentRepository } from './http-content.repository';
import { MockContentRepository } from './mock-content.repository';

/**
 * Where content comes from, decided at build time:
 * PUBLIC_API_URL set → the FastAPI read API (bundled content/ as fallback);
 * unset → the bundled content/ files only (the fully static deploy).
 */
export function provideContent(apiOrigin: string | null = API_ORIGIN): Provider[] {
  const source = apiOrigin ? HttpContentRepository : MockContentRepository;
  return [{ provide: ContentRepository, useClass: source }];
}
