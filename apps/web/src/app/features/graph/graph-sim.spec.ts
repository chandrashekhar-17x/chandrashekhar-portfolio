import { KnowledgeGraph } from '../../core/content/build-graph';
import { seededRandom } from '../../core/motion/seeded-random';
import { createSim, neighbourhood, nodeAt, resizeSim, settle, stepSim } from './graph-sim';

const graph: KnowledgeGraph = {
  nodes: [
    {
      id: 'hub:frontend',
      kind: 'hub',
      label: 'FRONTEND',
      category: 'frontend',
      size: 13,
      learning: false,
    },
    { id: 'skill:a', kind: 'skill', label: 'A', category: 'frontend', size: 6, learning: false },
    { id: 'skill:b', kind: 'skill', label: 'B', category: 'frontend', size: 6, learning: false },
    { id: 'project:p', kind: 'project', label: 'P', category: 'project', size: 8, learning: false },
  ],
  links: [
    { source: 'hub:frontend', target: 'skill:a', rel: 'IN_CATEGORY' },
    { source: 'hub:frontend', target: 'skill:b', rel: 'IN_CATEGORY' },
    { source: 'project:p', target: 'skill:a', rel: 'USED' },
    { source: 'project:p', target: 'skill:missing', rel: 'USED' },
  ],
};

describe('graph simulation', () => {
  const make = () => createSim(graph, 600, 400, seededRandom(42));

  it('drops links to unknown nodes and indexes nodes by id', () => {
    const sim = make();
    expect(sim.links).toHaveLength(3);
    expect(sim.byId.get('skill:a')?.label).toBe('A');
  });

  it('is deterministic for the same seed', () => {
    const a = make();
    const b = make();
    settle(a, 50);
    settle(b, 50);
    expect(a.nodes.map((n) => [n.x, n.y])).toEqual(b.nodes.map((n) => [n.x, n.y]));
  });

  it('keeps every node inside the canvas and cools down', () => {
    const sim = make();
    settle(sim, 300);
    expect(sim.nodes.every((n) => n.x >= 16 && n.x <= 584 && n.y >= 16 && n.y <= 384)).toBe(true);
    expect(sim.alpha).toBeLessThan(0.3);
  });

  it('leaves a dragged node where the pointer put it', () => {
    const sim = make();
    const node = sim.byId.get('skill:b');
    if (!node) throw new Error('missing');
    node.x = 100;
    node.y = 100;
    stepSim(sim, node);
    expect([node.x, node.y]).toEqual([100, 100]);
  });

  it('finds the node under a point and its neighbourhood', () => {
    const sim = make();
    const a = sim.byId.get('skill:a');
    if (!a) throw new Error('missing');
    expect(nodeAt(sim, a.x + 2, a.y + 2)).toBe(a);
    expect(nodeAt(sim, -500, -500)).toBeNull();
    expect([...neighbourhood(sim, a)].map((n) => n.id).sort()).toEqual([
      'hub:frontend',
      'project:p',
      'skill:a',
    ]);
  });

  it('scales positions when the canvas is resized', () => {
    const sim = make();
    const a = sim.byId.get('skill:a');
    if (!a) throw new Error('missing');
    const [x, y] = [a.x, a.y];
    resizeSim(sim, 1200, 800);
    expect(a.x).toBeCloseTo(x * 2);
    expect(a.y).toBeCloseTo(y * 2);
  });

  it('staggers pop-in: hubs first, then the rest', () => {
    const sim = createSim(graph, 600, 400, seededRandom(1), 1000);
    expect(sim.byId.get('hub:frontend')?.born).toBe(1000);
    expect(sim.byId.get('skill:a')?.born).toBeGreaterThan(1000);
  });
});
