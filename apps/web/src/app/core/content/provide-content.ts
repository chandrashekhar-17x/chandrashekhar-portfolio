import { Provider } from '@angular/core';

import { API_ORIGIN, CONTENT_FROM_API } from '../seo/site-origin.gen';
import { ContentRepository } from './content-repository';
import { HttpContentRepository } from './http-content.repository';
import { MockContentRepository } from './mock-content.repository';

/**
 * Where content comes from, decided at build time:
 * PUBLIC_API_URL + PUBLIC_CONTENT_SOURCE=api → the FastAPI read API (bundled
 * content/ as fallback); otherwise the bundled content/ files (fast, static).
 */
export function provideContent(
  apiOrigin: string | null = CONTENT_FROM_API ? API_ORIGIN : null,
): Provider[] {
  const source = apiOrigin ? HttpContentRepository : MockContentRepository;
  return [{ provide: ContentRepository, useClass: source }];
}
