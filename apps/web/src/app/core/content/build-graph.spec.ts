import { buildGraph, GraphInput } from './build-graph';

const input: GraphInput = {
  skills: [
    { id: 'angular', name: 'Angular', category: 'frontend', level: 5 },
    { id: 'rag', name: 'RAG', category: 'ai', level: 2, learning: true },
  ],
  experience: {
    organizations: [{ id: 'acme', name: 'Acme', kind: 'company' }],
    roles: [
      {
        id: 'fe',
        org: 'acme',
        title: 'Frontend Engineer',
        start: '2023-01',
        summary: 's',
        highlights: [],
        skills: ['angular'],
      },
    ],
  },
  projects: [
    {
      slug: 'cad',
      title: 'CAD',
      summary: 's',
      year: 2024,
      role: 'r',
      org: 'acme',
      status: 'shipped',
      featured: true,
      skills: ['angular', 'angular'],
      body: 'projects/cad.md',
    },
  ],
  extras: {
    topics: [{ id: 'uis', label: 'Complex UIs' }],
    edges: [
      { src: 'project:cad', dst: 'topic:uis', rel: 'RELATED' },
      { src: 'topic:uis', dst: 'project:cad', rel: 'RELATED' }, // same pair, reversed
      { src: 'skill:angular', dst: 'topic:missing', rel: 'RELATED' }, // dangling
    ],
  },
};

describe('buildGraph', () => {
  const graph = buildGraph(input);
  const ids = graph.nodes.map((n) => n.id);
  const has = (a: string, b: string) =>
    graph.links.some((l) => [l.source, l.target].sort().join() === [a, b].sort().join());

  it('creates hub, skill, org, role, project and topic nodes', () => {
    expect(ids).toEqual(
      expect.arrayContaining([
        'hub:frontend',
        'hub:ai',
        'skill:angular',
        'skill:rag',
        'org:acme',
        'role:fe',
        'project:cad',
        'topic:uis',
      ]),
    );
    expect(ids).not.toContain('hub:backend'); // no backend skills → no hub
  });

  it('derives links from content relations', () => {
    expect(has('hub:frontend', 'skill:angular')).toBe(true);
    expect(has('role:fe', 'org:acme')).toBe(true);
    expect(has('project:cad', 'skill:angular')).toBe(true);
    expect(has('project:cad', 'org:acme')).toBe(true);
    expect(has('project:cad', 'topic:uis')).toBe(true);
  });

  it('never duplicates a pair and drops links to unknown nodes', () => {
    const keys = graph.links.map((l) => [l.source, l.target].sort().join('|'));
    expect(new Set(keys).size).toBe(keys.length);
    expect(graph.links.some((l) => l.target === 'topic:missing')).toBe(false);
  });

  it('flags skills that are being learned', () => {
    expect(graph.nodes.find((n) => n.id === 'skill:rag')?.learning).toBe(true);
    expect(graph.nodes.find((n) => n.id === 'skill:angular')?.learning).toBe(false);
  });
});
