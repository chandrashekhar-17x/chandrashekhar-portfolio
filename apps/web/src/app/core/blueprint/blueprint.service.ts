import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

/**
 * "Blueprint mode": the page redrawn as a CAD drawing (a nod to the CAD editor I
 * built). Sets `data-blueprint` on <html>; the look lives in styles/components/_blueprint.scss
 * and the dimension lines in BlueprintOverlay. Not saved: it is a mode, not a setting.
 */
@Injectable({ providedIn: 'root' })
export class BlueprintService {
  private readonly doc = inject(DOCUMENT);
  private readonly current = signal(false);

  readonly on = this.current.asReadonly();

  toggle(): void {
    this.set(!this.current());
  }

  set(on: boolean): void {
    this.current.set(on);
    const root = this.doc.documentElement;
    if (on) root.setAttribute('data-blueprint', '');
    else root.removeAttribute('data-blueprint');
  }
}
