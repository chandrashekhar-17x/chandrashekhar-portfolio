import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AreaOfExperience } from '../../core/content/content.types.gen';

// Simple 24×24 line icons (stroke = currentColor), one per About area.
const PATHS: Record<AreaOfExperience['icon'], string> = {
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  document: 'M6 3h8l4 4v14H6V3zM14 3v4h4M9 12h6M9 16h6',
  plug: 'M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0V8zM12 17v4',
  gauge: 'M4 16a8 8 0 1116 0M12 16l4-5M8 20h8',
  server: 'M4 4h16v6H4V4zM4 14h16v6H4v-6zM8 7h.01M8 17h.01',
  compass: 'M12 21a9 9 0 100-18 9 9 0 000 18zM15.5 8.5l-2 5-5 2 2-5 5-2z',
  sparkles: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z',
};

/** Decorative icon for an About card (hidden from screen readers). */
@Component({
  selector: 'app-area-icon',
  template: `
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path [attr.d]="path()" />
    </svg>
  `,
  styles: `
    svg {
      fill: none;
      stroke: currentcolor;
      stroke-width: 1.6;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaIcon {
  readonly icon = input.required<AreaOfExperience['icon']>();
  protected readonly path = computed(() => PATHS[this.icon()]);
}
