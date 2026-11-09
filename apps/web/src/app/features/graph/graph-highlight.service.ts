import { Injectable, signal } from '@angular/core';

/**
 * Which graph nodes are "lit" right now (glowing + pulsing).
 * The chat (PR 6, later the real RAG agent) calls highlight() with the node ids
 * an answer cited; clicking a node lights it and its neighbours.
 */
@Injectable({ providedIn: 'root' })
export class GraphHighlightService {
  private readonly lit = signal<ReadonlySet<string>>(new Set());
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly ids = this.lit.asReadonly();

  /** Lights the given node ids for `durationMs` (prototype: 9 s). */
  highlight(ids: Iterable<string>, durationMs = 9000): void {
    clearTimeout(this.timer);
    this.lit.set(new Set(ids));
    this.timer = setTimeout(() => {
      this.clear();
    }, durationMs);
  }

  clear(): void {
    clearTimeout(this.timer);
    this.lit.set(new Set());
  }
}
