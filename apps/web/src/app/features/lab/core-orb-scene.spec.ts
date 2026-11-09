import { seededRandom } from '../../core/motion/seeded-random';
import { createParticles, drawOrb } from './core-orb-scene';

describe('core orb scene', () => {
  it('places particles on the unit sphere', () => {
    const ps = createParticles(50, seededRandom(1));
    for (const p of ps) expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1, 6);
  });

  it('draws three rings and one dot per particle', () => {
    const calls: string[] = [];
    const ctx = new Proxy(
      {},
      {
        get: (_t, prop: string) => () => {
          calls.push(prop);
        },
        set: () => true,
      },
    ) as CanvasRenderingContext2D;
    const ps = createParticles(20, seededRandom(1));
    drawOrb(ctx, ps, { width: 300, height: 300, t: 1, speaking: 0.5, front: '#0ff', back: '#f0f' });
    expect(calls.filter((c) => c === 'ellipse')).toHaveLength(3);
    expect(calls.filter((c) => c === 'arc')).toHaveLength(20);
  });
});
