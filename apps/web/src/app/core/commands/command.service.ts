import { Injectable, computed, signal } from '@angular/core';

export type CommandGroup = 'Sections' | 'Pages' | 'Actions';

export interface Command {
  id: string;
  label: string;
  group: CommandGroup;
  /** Extra words that should find this command (e.g. "dark" for the theme toggle). */
  keywords?: string;
  run: () => void;
}

/**
 * Registry + open state for the ⌘K palette. Features register their own commands,
 * so the palette never needs to know about them.
 */
@Injectable({ providedIn: 'root' })
export class CommandService {
  private readonly registered = signal<readonly Command[]>([]);
  readonly isOpen = signal(false);
  readonly commands = computed(() => this.registered());

  /** Adds commands; returns a function that removes them again. */
  register(commands: readonly Command[]): () => void {
    this.registered.update((all) => [
      ...all.filter((c) => !commands.some((n) => n.id === c.id)),
      ...commands,
    ]);
    const ids = new Set(commands.map((c) => c.id));
    return () => {
      this.registered.update((all) => all.filter((c) => !ids.has(c.id)));
    };
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((o) => !o);
  }
}

/**
 * Every word of the query must appear in the label, group or keywords.
 * Labels that start with the query rank first; otherwise registration order is kept.
 */
export function filterCommands(commands: readonly Command[], query: string): Command[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [...commands];
  const matches = commands.filter((c) => {
    const haystack = `${c.label} ${c.group} ${c.keywords ?? ''}`.toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
  const q = words.join(' ');
  return matches.sort(
    (a, b) =>
      Number(b.label.toLowerCase().startsWith(q)) - Number(a.label.toLowerCase().startsWith(q)),
  );
}
