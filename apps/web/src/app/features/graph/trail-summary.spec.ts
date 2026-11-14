import { GraphNode } from '../../core/content/build-graph';
import { pickAnswer } from '../chat/scripted-answers';
import { TRAIL_QUESTIONS, summarizeTrail } from './trail-summary';

const node = (id: string, category: GraphNode['category'], kind: GraphNode['kind'] = 'skill') =>
  ({ id, kind, label: id, category, size: 4, learning: false }) satisfies GraphNode;

const NODES = [
  node('hub:cad', 'cad', 'hub'),
  node('skill:three', 'cad'),
  node('skill:dxf', 'cad'),
  node('skill:angular', 'frontend'),
  node('project:cad-editor', 'project', 'project'),
];

describe('summarizeTrail', () => {
  it('needs a few real nodes first (hubs do not count)', () => {
    expect(summarizeTrail(NODES, ['hub:cad', 'skill:three', 'skill:dxf'])).toBeNull();
  });

  it('names the area explored most', () => {
    const s = summarizeTrail(NODES, ['skill:angular', 'skill:three', 'skill:dxf', 'nope']);
    expect(s).toEqual({
      count: 3,
      area: 'CAD & visualization',
      inArea: 2,
      question: 'What did you build with Three.js, WebGL and DXF?',
    });
  });

  it('breaks ties by what was explored first', () => {
    const s = summarizeTrail(NODES, ['skill:angular', 'skill:three', 'project:cad-editor']);
    expect(s?.area).toBe('Frontend');
  });

  it('asks questions the agent can answer (never the "not in profile" fallback)', () => {
    for (const q of Object.values(TRAIL_QUESTIONS)) {
      expect(pickAnswer(q).intent, q).not.toBe('off-topic');
    }
  });
});
