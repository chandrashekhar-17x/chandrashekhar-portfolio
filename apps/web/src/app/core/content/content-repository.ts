import { Observable } from 'rxjs';

import {
  AILab,
  About,
  EducationEntry,
  Experience,
  Profile,
  Project,
  Skill,
} from './content.types.gen';
import { KnowledgeGraph } from './build-graph';

/** A project plus its case-study markdown (loaded only on the detail page). */
export interface ProjectDetail extends Project {
  bodyMarkdown: string;
}

/**
 * The one place the UI gets content from.
 *
 * Components inject `ContentRepository` and never know where data comes from.
 * Phase 1 provides `MockContentRepository` (reads content/ JSON at build time);
 * Phase 2 swaps in an HTTP implementation by changing a single provider.
 * Abstract class (not interface) so it can be used directly as the DI token.
 */
export abstract class ContentRepository {
  abstract profile(): Observable<Profile>;
  abstract skills(): Observable<Skill[]>;
  abstract experience(): Observable<Experience>;
  abstract education(): Observable<EducationEntry[]>;
  abstract about(): Observable<About>;
  abstract projects(): Observable<Project[]>;
  abstract project(slug: string): Observable<ProjectDetail | undefined>;
  abstract graph(): Observable<KnowledgeGraph>;
  abstract lab(): Observable<AILab>;
}
