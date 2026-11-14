import { TestBed } from '@angular/core/testing';

import { RevealTimeline, revealNote } from './reveal-timeline.service';

describe('RevealTimeline', () => {
  it('numbers sections in reveal order and keeps the first time', () => {
    const t = TestBed.inject(RevealTimeline);
    t.record('graph');
    t.record('work');
    t.record('graph');
    t.record('');
    expect(t.get('graph')?.order).toBe(1);
    expect(t.get('work')?.order).toBe(2);
    expect(t.get('about')).toBeUndefined();
  });

  it('labels lazy and eager sections', () => {
    expect(revealNote({ order: 2, at: 1420 })).toBe('@defer #2 · +1.42 s');
    expect(revealNote(undefined)).toBe('eager');
  });
});
