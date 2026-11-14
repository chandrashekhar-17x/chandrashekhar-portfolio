import { Injectable } from '@angular/core';

export interface RevealEntry {
  /** 1 = the first lazy section revealed on this page load. */
  order: number;
  /** ms since the page started loading (performance.now()). */
  at: number;
}

/**
 * Remembers when each lazy (`@defer`) section was revealed, so blueprint mode can
 * show how the page loaded: "#graph · @defer #2 · +1.42 s". Write-only during
 * normal browsing; nothing reads it unless blueprint mode is on.
 */
@Injectable({ providedIn: 'root' })
export class RevealTimeline {
  private readonly entries = new Map<string, RevealEntry>();

  record(sectionId: string): void {
    if (!sectionId || this.entries.has(sectionId)) return;
    this.entries.set(sectionId, { order: this.entries.size + 1, at: performance.now() });
  }

  get(sectionId: string): RevealEntry | undefined {
    return this.entries.get(sectionId);
  }
}

/** Short label for a section: lazy ones show order and time, others are eager. */
export function revealNote(entry: RevealEntry | undefined): string {
  if (!entry) return 'eager';
  return `@defer #${String(entry.order)} · +${(entry.at / 1000).toFixed(2)} s`;
}
