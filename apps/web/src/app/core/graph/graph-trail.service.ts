import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const KEY = 'graph-trail';
const MAX = 60;

/**
 * The visitor's trail through the knowledge graph: node ids they lingered on or
 * clicked, in order. Kept for this tab only (sessionStorage), never sent anywhere.
 */
@Injectable({ providedIn: 'root' })
export class GraphTrail {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly list = signal<readonly string[]>(this.load());

  readonly visited = this.list.asReadonly();

  visit(id: string): void {
    if (this.list().includes(id)) return;
    this.list.update((l) => [...l, id].slice(-MAX));
    this.save();
  }

  clear(): void {
    this.list.set([]);
    this.save();
  }

  private load(): string[] {
    if (!this.browser) return [];
    try {
      const raw: unknown = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
      return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    if (!this.browser) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(this.list()));
    } catch {
      // Storage blocked: the trail still works for this page view.
    }
  }
}
