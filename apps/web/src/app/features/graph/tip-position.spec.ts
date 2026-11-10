import { tipPosition } from './tip-position';

const box = { width: 800, height: 500 };
const tip = { width: 200, height: 80 };

describe('tipPosition', () => {
  it('sits below-right of the pointer when there is room', () => {
    expect(tipPosition(100, 100, tip, box)).toEqual({ left: 114, top: 114 });
  });

  it('flips left near the right edge and above near the bottom edge', () => {
    expect(tipPosition(780, 480, tip, box)).toEqual({ left: 566, top: 386 });
  });

  it('never leaves the box near the top-left corner', () => {
    const p = tipPosition(2, 2, tip, box);
    expect(p.left).toBeGreaterThanOrEqual(8);
    expect(p.top).toBeGreaterThanOrEqual(8);
  });

  it('stays inside even when the box is barely bigger than the tooltip (phones)', () => {
    const small = { width: 220, height: 120 };
    for (const [x, y] of [
      [0, 0],
      [110, 60],
      [220, 120],
    ] as const) {
      const p = tipPosition(x, y, tip, small);
      expect(p.left + tip.width).toBeLessThanOrEqual(small.width - 8 + 0.001);
      expect(p.top + tip.height).toBeLessThanOrEqual(small.height - 8 + 0.001);
    }
  });
});
