import { firstValueFrom } from 'rxjs';

import { MockContentRepository } from '../../core/content/mock-content.repository';
import { clusterView, hubOverview } from './graph-view';

describe('small-screen graph views', () => {
  const graph = () => firstValueFrom(new MockContentRepository().graph());

  it('overview shows only hubs, linked when a project spans both areas', async () => {
    const view = hubOverview(await graph());
    expect(view.nodes.every((n) => n.kind === 'hub')).toBe(true);
    expect(view.nodes.length).toBeGreaterThanOrEqual(8);
    expect(view.links.length).toBeGreaterThan(0);
    const ids = new Set(view.nodes.map((n) => n.id));
    expect(view.links.every((l) => ids.has(l.source) && ids.has(l.target))).toBe(true);
    // No hub is left without a link.
    const linked = new Set(view.links.flatMap((l) => [l.source, l.target]));
    expect(view.nodes.every((n) => linked.has(n.id))).toBe(true);
  });

  it('a cluster keeps its hub, skills and linked projects, and is small', async () => {
    const view = clusterView(await graph(), 'cad');
    const ids = view.nodes.map((n) => n.id);
    expect(ids).toContain('hub:cad');
    expect(ids).toContain('skill:threejs');
    expect(ids).toContain('project:custom-cad-editor');
    expect(ids.filter((id) => id.startsWith('hub:'))).toEqual(['hub:cad']);
    expect(view.nodes.length).toBeLessThan(35);
  });
});
