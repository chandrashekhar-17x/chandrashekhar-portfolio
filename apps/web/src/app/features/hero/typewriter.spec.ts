import { TYPE_DELAYS, TypeState, nextTypeStep } from './typewriter';

describe('nextTypeStep', () => {
  const phrases = ['ab', 'c'];

  it('types, holds, erases, then moves to the next phrase', () => {
    let s: TypeState = { index: 0, chars: 0, deleting: false };
    const seen: [string, number][] = [];
    for (let i = 0; i < 8; i++) {
      const step = nextTypeStep(phrases, s);
      seen.push([step.text, step.delayMs]);
      s = step.state;
    }
    expect(seen).toEqual([
      ['a', TYPE_DELAYS.type],
      ['ab', TYPE_DELAYS.type],
      ['ab', TYPE_DELAYS.hold],
      ['a', TYPE_DELAYS.erase],
      ['', TYPE_DELAYS.erase],
      ['', TYPE_DELAYS.next], // switched to phrase 2
      ['c', TYPE_DELAYS.type],
      ['c', TYPE_DELAYS.hold],
    ]);
  });

  it('wraps around to the first phrase', () => {
    const step = nextTypeStep(phrases, { index: 1, chars: 0, deleting: true });
    expect(step.state.index).toBe(0);
  });

  it('copes with an empty list', () => {
    expect(nextTypeStep([], { index: 0, chars: 0, deleting: false }).text).toBe('');
  });
});
