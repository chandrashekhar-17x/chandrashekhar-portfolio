import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { API_ORIGIN } from '../seo/site-origin.gen';
import { KnowledgeGraph } from './build-graph';
import { ContentRepository, ProjectDetail } from './content-repository';
import {
  AILab,
  About,
  EducationEntry,
  Experience,
  Profile,
  Project,
  Skill,
} from './content.types.gen';
import { MockContentRepository } from './mock-content.repository';

/**
 * Phase 2 data source: the FastAPI read API (`/api/v1/...`, see docs/API.md).
 *
 * - Same shapes as the content/ files, so components don't change.
 * - SSR fetches once; Angular's HTTP transfer cache hands the result to the
 *   browser, so hydration doesn't fetch the same JSON again.
 * - If the API is down or slow to deploy, every call falls back to the bundled
 *   content/ data: the site never renders empty sections.
 */
@Injectable()
export class HttpContentRepository extends ContentRepository {
  private readonly http = inject(HttpClient);
  private readonly fallback = new MockContentRepository();
  private readonly base = `${API_ORIGIN ?? ''}/api/v1`;

  private get<T>(path: string, backup: () => Observable<T>): Observable<T> {
    return this.http.get<T>(this.base + path).pipe(catchError(() => backup()));
  }

  profile(): Observable<Profile> {
    return this.get('/profile', () => this.fallback.profile());
  }

  skills(): Observable<Skill[]> {
    return this.get('/skills', () => this.fallback.skills());
  }

  experience(): Observable<Experience> {
    return this.get('/experience', () => this.fallback.experience());
  }

  education(): Observable<EducationEntry[]> {
    return this.get('/education', () => this.fallback.education());
  }

  about(): Observable<About> {
    return this.get('/about', () => this.fallback.about());
  }

  projects(): Observable<Project[]> {
    return this.get('/projects', () => this.fallback.projects());
  }

  project(slug: string): Observable<ProjectDetail | undefined> {
    return this.http.get<ProjectDetail>(`${this.base}/projects/${encodeURIComponent(slug)}`).pipe(
      catchError((err: unknown) =>
        // A real 404 means "no such project"; anything else → bundled copy.
        err instanceof HttpErrorResponse && err.status === 404
          ? of(undefined)
          : this.fallback.project(slug),
      ),
    );
  }

  graph(): Observable<KnowledgeGraph> {
    return this.get('/graph', () => this.fallback.graph());
  }

  lab(): Observable<AILab> {
    return this.get('/lab', () => this.fallback.lab());
  }
}
