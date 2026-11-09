import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { ChatStore } from '../../core/chat/chat-store.service';
import { Command, CommandService, filterCommands } from '../../core/commands/command.service';
import { ThemeService } from '../../core/theme/theme.service';
import { defaultCommands } from './default-commands';

/**
 * ⌘K / Ctrl+K palette (prototype .cmdk) on a native <dialog>: focus is trapped and
 * Esc closes it for free. ARIA combobox + listbox, fully keyboard driven.
 */
@Component({
  selector: 'app-command-palette',
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPalette {
  protected readonly service = inject(CommandService);
  protected readonly query = signal('');
  protected readonly active = signal(0);
  protected readonly results = computed(() =>
    filterCommands(this.service.commands(), this.query()),
  );
  /** id of the highlighted option, for aria-activedescendant. */
  protected readonly activeId = computed(() => {
    const c = this.results()[this.active()];
    return c ? this.optionId(c) : null;
  });

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  /** Set when *we* close the dialog, so its (async) close event is not mistaken for Esc. */
  private closingInCode = false;

  constructor() {
    const unregister = this.service.register(
      defaultCommands(inject(Router), inject(ThemeService), inject(ChatStore)),
    );
    inject(DestroyRef).onDestroy(unregister);

    // Open/close the native dialog when the service says so.
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.service.isOpen() && !dialog.open) {
        this.query.set('');
        this.active.set(0);
        dialog.showModal();
        this.input().nativeElement.focus();
      } else if (!this.service.isOpen() && dialog.open) {
        this.closingInCode = true;
        dialog.close();
      }
    });
  }

  protected optionId(c: Command): string {
    return `cmd-${c.id.replace(/[^a-z0-9-]/gi, '-')}`;
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.results().length;
    if (!count) return;
    const moves: Record<string, number> = {
      ArrowDown: (this.active() + 1) % count,
      ArrowUp: (this.active() - 1 + count) % count,
      Home: 0,
      End: count - 1,
    };
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      this.active.set(next);
      const id = this.activeId();
      if (id) document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = this.results()[this.active()];
      if (command) this.run(command);
    }
  }

  protected run(command: Command): void {
    this.service.close();
    command.run();
  }

  /**
   * The browser fires "close" asynchronously. A close we started in code must not
   * touch the service: with a fast ⌘K the palette may already be reopening, and the
   * stale event would shut it again. Only user closes (Esc) update the service.
   */
  protected onDialogClosed(): void {
    if (this.closingInCode) {
      this.closingInCode = false;
      return;
    }
    this.service.close();
  }

  /** Clicks on the dimmed backdrop (the dialog element itself) close the palette. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.service.close();
  }
}
