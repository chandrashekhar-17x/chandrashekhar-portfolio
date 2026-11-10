import { Injectable } from '@angular/core';
import { from, map, Observable, of } from 'rxjs';

import aboutJson from '@content/data/about.json';
import educationJson from '@content/data/education.json';
import experienceJson from '@content/data/experience.json';
import graphJson from '@content/data/graph.json';
import labJson from '@content/data/lab.json';
import profileJson from '@content/data/profile.json';
import projectsJson from '@content/data/projects.json';
import skillsJson from '@content/data/skills.json';

import { buildGraph, KnowledgeGraph } from './build-graph';
import { ContentRepository, ProjectDetail } from './content-repository';
import {
  AILab,
  About,
  Education,
  EducationEntry,
  Experience,
  KnowledgeGraphExtras,
  Profile,
  Project,
  Projects,
  Skill,
  Skills,
} from './content.types.gen';

// JSON imports are typed by shape inference; the generated types are the contract.
const profile = profileJson as Profile;
const skills = (skillsJson as Skills).skills;
const experience = experienceJson as Experience;
const projects = (projectsJson as Projects).projects;
const lab = labJson as AILab;
const education = (educationJson as Education).education;
const about = aboutJson as About;
const graph = buildGraph({
  skills,
  experience,
  education,
  projects,
  extras: graphJson as KnowledgeGraphExtras,
});

/**
 * Phase 1 data source: the seed files in content/, bundled at build time.
 * `of(...)` emits synchronously, so SSR renders real content with no waiting.
 * Replaced by an HTTP repository in Phase 2.
 */
@Injectable()
export class MockContentRepository extends ContentRepository {
  profile(): Observable<Profile> {
    return of(profile);
  }

  skills(): Observable<Skill[]> {
    return of(skills);
  }

  experience(): Observable<Experience> {
    return of(experience);
  }

  education(): Observable<EducationEntry[]> {
    return of(education);
  }

  about(): Observable<About> {
    return of(about);
  }

  projects(): Observable<Project[]> {
    return of(projects);
  }

  project(slug: string): Observable<ProjectDetail | undefined> {
    const project = projects.find((p) => p.slug === slug);
    if (!project) return of(undefined);
    return from(loadCaseStudy(project.body)).pipe(
      map((bodyMarkdown) => ({ ...project, bodyMarkdown })),
    );
  }

  graph(): Observable<KnowledgeGraph> {
    return of(graph);
  }

  lab(): Observable<AILab> {
    return of(lab);
  }
}

/** Case studies are separate lazy chunks: only the visited one is downloaded. */
async function loadCaseStudy(body: string): Promise<string> {
  const file = body.replace(/^projects\//, '').replace(/\.md$/, '');
  const mod = (await import(`../../../../../../content/projects/${file}.md`)) as {
    default: string;
  };
  return mod.default;
}
