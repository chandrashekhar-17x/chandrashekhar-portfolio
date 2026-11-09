import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MediaPrefs } from '../motion/media-prefs.service';
import { RevealQueue } from './reveal-queue.service';

function setup(reducedMotion: boolean): RevealQueue {
  TestBed.configureTestingModule({
    providers: [{ provide: MediaPrefs, useValue: { reducedMotion: signal(reducedMotion) } }],
  });
  return TestBed.inject(RevealQueue);
}

describe('RevealQueue', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reveals items one at a time, in request order, with a pause between', async () => {
    vi.useFakeTimers();
    const queue = setup(false);
    const order: string[] = [];

    void queue.enqueue(() => order.push('graph'), 300);
    void queue.enqueue(() => order.push('work'), 300);
    void queue.enqueue(() => order.push('lab'), 300);

    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual(['graph']);
    await vi.advanceTimersByTimeAsync(300);
    expect(order).toEqual(['graph', 'work']);
    await vi.advanceTimersByTimeAsync(300);
    expect(order).toEqual(['graph', 'work', 'lab']);
  });

  it('skips the pauses when the user prefers reduced motion', async () => {
    const queue = setup(true);
    const order: number[] = [];
    await Promise.all([1, 2, 3].map((n) => queue.enqueue(() => order.push(n), 5000)));
    expect(order).toEqual([1, 2, 3]);
  });

  it('keeps going after a reveal throws', async () => {
    const queue = setup(true);
    const done: string[] = [];
    const failing = queue.enqueue(() => {
      throw new Error('boom');
    });
    await expect(failing).rejects.toThrow('boom');
    await queue.enqueue(() => done.push('next'));
    expect(done).toEqual(['next']);
  });
});
