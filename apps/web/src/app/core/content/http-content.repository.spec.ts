import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ContentRepository } from './content-repository';
import { HttpContentRepository } from './http-content.repository';
import { MockContentRepository } from './mock-content.repository';
import { provideContent } from './provide-content';

describe('HttpContentRepository', () => {
  let repo: HttpContentRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HttpContentRepository, provideHttpClient(), provideHttpClientTesting()],
    });
    repo = TestBed.inject(HttpContentRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('reads the profile from /api/v1/profile', async () => {
    const result = firstValueFrom(repo.profile());
    http.expectOne((r) => r.url.endsWith('/api/v1/profile')).flush({ name: 'From API' });
    expect((await result).name).toBe('From API');
  });

  it('falls back to the bundled content when the API fails', async () => {
    const result = firstValueFrom(repo.skills());
    http
      .expectOne((r) => r.url.endsWith('/api/v1/skills'))
      .flush('down', { status: 503, statusText: 'Unavailable' });
    expect((await result).length).toBeGreaterThan(0);
  });

  it('treats a 404 project as missing, not as an outage', async () => {
    const result = firstValueFrom(repo.project('nope'));
    http
      .expectOne((r) => r.url.endsWith('/api/v1/projects/nope'))
      .flush({ error: { code: 'NOT_FOUND' } }, { status: 404, statusText: 'Not Found' });
    expect(await result).toBeUndefined();
  });
});

describe('provideContent', () => {
  const pick = (origin: string | null) =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideContent(origin)],
    }).inject(ContentRepository);

  it('uses the bundled content when no API is configured', () => {
    expect(pick(null)).toBeInstanceOf(MockContentRepository);
  });

  it('uses the API when PUBLIC_API_URL was set at build time', () => {
    TestBed.resetTestingModule();
    expect(pick('https://api.example.dev')).toBeInstanceOf(HttpContentRepository);
  });
});
