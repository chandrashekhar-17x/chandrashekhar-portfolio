import { seededRandom } from '../../core/motion/seeded-random';
import { createStars, drawHeroScene } from './hero-scene';

/** Minimal fake 2D context that records method calls (jsdom has no canvas). */
function fakeContext(): { ctx: CanvasRenderingContext2D; calls: string[] } {
  const calls: string[] = [];
  const gradient = { addColorStop: () => undefined };
  const ctx = new Proxy(
    {},
    {
      get: (_t, prop: string) => {
        if (prop.startsWith('create')) return () => gradient;
        return () => {
          calls.push(prop);
        };
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D;
  return { ctx, calls };
}

describe('hero scene', () => {
  it('creates one star per ~5000 px², all in the top 75 %', () => {
    const stars = createStars(1000, 500, seededRandom(1));
    expect(stars).toHaveLength(100);
    expect(stars.every((s) => s.y <= 375 && s.x <= 1000 && s.z >= 0.2)).toBe(true);
  });

  it('is deterministic for the same seed (stable screenshots)', () => {
    expect(createStars(400, 300, seededRandom(7))).toEqual(createStars(400, 300, seededRandom(7)));
  });

  it('draws stars in a few batched fills (not one per star), both themes', () => {
    const stars = createStars(400, 300, seededRandom(7));
    for (const light of [false, true]) {
      const { ctx, calls } = fakeContext();
      drawHeroScene(ctx, stars, {
        width: 400,
        height: 300,
        t: 1,
        mouseX: 0.2,
        mouseY: -0.1,
        light,
      });
      // 4 twinkle batches + hill + glow → a handful of fills, independent of star count.
      expect(calls.filter((c) => c === 'fill').length).toBeLessThanOrEqual(6);
      expect(calls).toContain('stroke');
      expect(calls).toContain('clearRect'); // transparent canvas: the sky is CSS
    }
  });
});
