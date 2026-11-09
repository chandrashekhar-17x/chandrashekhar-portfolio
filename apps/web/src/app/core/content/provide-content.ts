import { Provider } from '@angular/core';

import { ContentRepository } from './content-repository';
import { MockContentRepository } from './mock-content.repository';

/** Swap the data source here (Phase 2: HttpContentRepository). */
export function provideContent(): Provider[] {
  return [{ provide: ContentRepository, useClass: MockContentRepository }];
}
