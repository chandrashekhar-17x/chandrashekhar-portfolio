import { dimensions } from './dimensions';

describe('dimensions', () => {
  it('draws a width and a height line with the real sizes', () => {
    const { lines, tags } = dimensions(
      [{ id: 'work', left: 0, top: 100, width: 1200, height: 640 }],
      1440,
      900,
    );
    expect(lines.map((l) => [l.key, l.text])).toEqual([
      ['work-w', '1200'],
      ['work-h', '640'],
    ]);
    expect(tags).toEqual([{ key: 'work', x: 32, y: 136, text: '#work' }]);
  });

  it('keeps the real height when the box is taller than the screen', () => {
    const { lines } = dimensions(
      [{ id: 'graph', left: 0, top: -500, width: 1200, height: 2000 }],
      1440,
      900,
    );
    expect(lines).toHaveLength(1); // its top edge is off-screen: no width line
    const [h] = lines;
    expect(h?.text).toBe('2000');
    expect(h?.y1).toBe(0);
    expect(h?.y2).toBe(900);
  });

  it('skips boxes that are barely on screen', () => {
    const { lines } = dimensions(
      [{ id: 'xp', left: 0, top: 880, width: 1200, height: 500 }],
      1440,
      900,
    );
    expect(lines).toEqual([]);
  });

  it('keeps lines out from under the sticky nav', () => {
    const box = { id: 'about', left: 0, top: 50, width: 1200, height: 600 };
    const { lines } = dimensions([box], 1440, 900, 65);
    expect(lines.map((l) => l.key)).toEqual(['about-h']); // width line at y 64 is hidden
    expect(lines[0]?.y1).toBe(78);
  });
});
