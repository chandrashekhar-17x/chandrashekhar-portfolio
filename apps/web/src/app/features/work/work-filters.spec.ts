import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import { sortProjects } from './work-filters';

describe('sortProjects', () => {
  it('puts featured projects first, professional before personal', async () => {
    const projects = await firstValueFrom(new MockContentRepository().projects());
    const sorted = sortProjects(projects);
    const firstNonFeatured = sorted.findIndex((p) => !p.featured);
    expect(sorted.slice(0, firstNonFeatured).every((p) => p.featured)).toBe(true);
    expect(sorted[0]?.slug).toBe('custom-cad-editor');
    const rest = sorted.slice(firstNonFeatured);
    const firstPersonal = rest.findIndex((p) => p.type === 'personal');
    expect(rest.slice(firstPersonal).every((p) => p.type === 'personal')).toBe(true);
    expect(sorted).toHaveLength(projects.length);
  });
});
