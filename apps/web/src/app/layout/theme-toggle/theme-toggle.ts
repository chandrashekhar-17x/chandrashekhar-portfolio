import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ThemeService } from '../../core/theme/theme.service';

/** ◐ button that switches dark/light. */
@Component({
  selector: 'app-theme-toggle',
  template: `
    <button type="button" class="icon-btn" [attr.aria-label]="label()" (click)="theme.toggle()">
      <span aria-hidden="true">◐</span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly label = computed(
    () => `Switch to ${this.theme.theme() === 'dark' ? 'light' : 'dark'} theme`,
  );
}
