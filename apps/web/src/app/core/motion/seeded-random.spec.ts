import { seededRandom } from './seeded-random';

describe('seededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('returns numbers in [0, 1) and differs between seeds', () => {
    const r = seededRandom(1);
    const values = Array.from({ length: 1000 }, r);
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    expect(seededRandom(2)()).not.toBe(seededRandom(1)());
  });
});
