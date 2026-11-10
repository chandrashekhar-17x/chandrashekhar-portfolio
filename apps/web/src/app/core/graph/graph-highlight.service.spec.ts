import { TestBed } from '@angular/core/testing';

import { GraphHighlightService } from './graph-highlight.service';

describe('GraphHighlightService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('lights node ids and clears them after the duration', () => {
    vi.useFakeTimers();
    const service = TestBed.inject(GraphHighlightService);

    service.highlight(['skill:rag', 'project:x'], 1000);
    expect([...service.ids()]).toEqual(['skill:rag', 'project:x']);

    vi.advanceTimersByTime(999);
    expect(service.ids().size).toBe(2);
    vi.advanceTimersByTime(1);
    expect(service.ids().size).toBe(0);
  });

  it('a new highlight replaces the old one and restarts the timer', () => {
    vi.useFakeTimers();
    const service = TestBed.inject(GraphHighlightService);
    service.highlight(['a'], 1000);
    vi.advanceTimersByTime(800);
    service.highlight(['b'], 1000);
    vi.advanceTimersByTime(800);
    expect([...service.ids()]).toEqual(['b']);
  });
});
