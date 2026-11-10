import { journeySteps, tldrBullets } from './tldr';

describe('tldrBullets', () => {
  it('takes the first bullets of the TL;DR section without markdown', () => {
    const md =
      '## TL;DR\n- Started with **zero** background.\n- Two\n- Three\n- Four\n\n## Next\n- no';
    expect(tldrBullets(md)).toEqual(['Started with zero background.', 'Two', 'Three']);
  });

  it('returns nothing when there is no TL;DR', () => {
    expect(tldrBullets('## Problem\n- x')).toEqual([]);
  });

  it('reads all bullets at the end of a file, including Windows newlines', () => {
    expect(tldrBullets('## TL;DR\r\n- One\r\n- Two', 5)).toEqual(['One', 'Two']);
  });
});

describe('journeySteps', () => {
  it('reads the approaches and their outcome markers in order', () => {
    const md =
      '2. **Approach 1: backend** · ✗\n   text\n3. **Approach 2: library** · ◐\n4. **Approach 3: custom** · ✓';
    expect(journeySteps(md)).toEqual([
      { label: 'Approach 1: backend', outcome: '✗', kind: 'no', spoken: 'dropped' },
      { label: 'Approach 2: library', outcome: '◐', kind: 'part', spoken: 'partly worked' },
      { label: 'Approach 3: custom', outcome: '✓', kind: 'ok', spoken: 'shipped' },
    ]);
  });
});
