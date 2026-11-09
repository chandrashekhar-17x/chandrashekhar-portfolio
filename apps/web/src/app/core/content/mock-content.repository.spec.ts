import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from './mock-content.repository';

describe('MockContentRepository (real content/ files)', () => {
  const repo = new MockContentRepository();

  it('serves the profile and projects from content/', async () => {
    const profile = await firstValueFrom(repo.profile());
    const projects = await firstValueFrom(repo.projects());

    expect(profile.name).toBe('Chandrashekhar');
    expect(projects.length).toBeGreaterThan(0);
  });

  it('loads a case study with its markdown body', async () => {
    const detail = await firstValueFrom(repo.project('cad-editor'));
    expect(detail?.bodyMarkdown).toContain('## Problem');
  });

  it('returns undefined for an unknown project', async () => {
    expect(await firstValueFrom(repo.project('nope'))).toBeUndefined();
  });

  it('builds a connected graph where every link end exists', async () => {
    const graph = await firstValueFrom(repo.graph());
    const ids = new Set(graph.nodes.map((n) => n.id));
    expect(graph.links.every((l) => ids.has(l.source) && ids.has(l.target))).toBe(true);
  });
});
