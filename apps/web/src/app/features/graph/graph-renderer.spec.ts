import { Sim, SimNode } from './graph-sim';
import {
  RenderState,
  edgeLabels,
  growth,
  isDimmed,
  shortLabel,
  splitLabel,
} from './graph-renderer';

const node = (over: Partial<SimNode> = {}): SimNode => ({
  id: 'skill:a',
  kind: 'skill',
  label: 'A',
  category: 'frontend',
  size: 6,
  learning: false,
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  born: 0,
  phase: 0,
  ...over,
});
const state = (over: Partial<RenderState> = {}): RenderState => ({
  hovered: null,
  filter: null,
  lit: new Set(),
  now: 0,
  animate: true,
  ...over,
});

describe('graph renderer helpers', () => {
  it('grows nodes in after they are born, unless motion is off', () => {
    const n = node({ born: 1000 });
    expect(growth(n, 900, true)).toBe(0);
    expect(growth(n, 1550, true)).toBe(1);
    expect(growth(n, 1200, true)).toBeGreaterThan(0);
    expect(growth(n, 0, false)).toBe(1);
  });

  it('dims nodes outside the hover focus', () => {
    const a = node();
    const b = node({ id: 'skill:b' });
    expect(isDimmed(b, state(), new Set([a]))).toBe(true);
    expect(isDimmed(a, state(), new Set([a]))).toBe(false);
  });

  it('filtering keeps only the chosen category bright, including only its own hub', () => {
    // Regression: every hub used to stay bright, so "Frontend" still lit BACKEND, TOOLS, …
    const s = state({ filter: 'frontend' });
    expect(isDimmed(node(), s, null)).toBe(false); // frontend skill
    expect(isDimmed(node({ kind: 'hub' }), s, null)).toBe(false); // FRONTEND hub
    expect(isDimmed(node({ kind: 'hub', category: 'backend' }), s, null)).toBe(true);
    expect(isDimmed(node({ kind: 'project', category: 'project' }), s, null)).toBe(true);
  });

  it('dims everything except lit nodes while a highlight is active', () => {
    const s = state({ lit: new Set(['skill:a']) });
    expect(isDimmed(node(), s, null)).toBe(false);
    expect(isDimmed(node({ id: 'skill:b' }), s, null)).toBe(true);
  });

  it('labels only the hovered node\'s "built on" / "demonstrates" links, at the midpoint', () => {
    const a = node({ id: 'project:a', x: 0, y: 0 });
    const b = node({ id: 'project:b', x: 100, y: 50 });
    const c = node({ id: 'skill:c', x: 10, y: 10 });
    const sim = {
      nodes: [a, b, c],
      links: [
        { source: b, target: a, rel: 'BUILT_ON' },
        { source: a, target: c, rel: 'USED' },
      ],
    } as unknown as Sim;
    expect(edgeLabels(sim, a)).toEqual([{ text: 'built on', x: 50, y: 21 }]);
    expect(edgeLabels(sim, c)).toEqual([]);
  });

  it('shortens long canvas labels and leaves short ones alone', () => {
    expect(shortLabel('Portfolio RAG Agent (this site)')).toBe('Portfolio RAG Agent');
    expect(shortLabel('Custom CAD Viewer & Editor, built from zero')).toBe(
      'Custom CAD Viewer & E…',
    );
    expect(shortLabel('Angular')).toBe('Angular');
  });

  it('splits long hub names into two balanced lines', () => {
    expect(splitLabel('DOCUMENT PROCESSING')).toEqual(['DOCUMENT', 'PROCESSING']);
    expect(splitLabel('CAD & VISUALIZATION')).toEqual(['CAD &', 'VISUALIZATION']);
    expect(splitLabel('FRONTEND')).toEqual(['FRONTEND']);
  });
});
