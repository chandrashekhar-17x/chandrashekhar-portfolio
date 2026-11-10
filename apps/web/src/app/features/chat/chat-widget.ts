import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { map } from 'rxjs';

import { ChatStore, MAX_QUESTION_LENGTH } from '../../core/chat/chat-store.service';
import { ContentRepository } from '../../core/content/content-repository';
import { GraphHighlightService } from '../../core/graph/graph-highlight.service';
import { SUGGESTED_QUESTIONS } from './scripted-answers';

/** Floating orb + chat panel (prototype .fab / .chat). Loaded lazily by the app shell. */
@Component({
  selector: 'app-chat-widget',
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // A method, not an expression: in Angular a handler that *returns false* calls
  // preventDefault(), and "isOpen() && close()" returned false, swallowing every Esc
  // on the page (it broke the ⌘K dialog's Esc). See docs/debuging.md.
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class ChatWidget {
  protected readonly store = inject(ChatStore);
  protected readonly suggestions = SUGGESTED_QUESTIONS;
  protected readonly maxLength = MAX_QUESTION_LENGTH;
  protected readonly draft = signal('');

  /** Node id → label, for citation chips. */
  protected readonly labels = toSignal(
    inject(ContentRepository)
      .graph()
      .pipe(map((g) => new Map(g.nodes.map((n) => [n.id, n.label])))),
    { initialValue: new Map<string, string>() },
  );
  /** Only finished answers are announced to screen readers (not every streamed word). */
  protected readonly announcement = computed(() => {
    const last = this.store.messages().at(-1);
    return last?.role === 'assistant' && !last.streaming ? last.text : '';
  });

  private readonly log = viewChild<ElementRef<HTMLElement>>('log');
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly fab = viewChild.required<ElementRef<HTMLButtonElement>>('fab');
  private readonly highlights = inject(GraphHighlightService);
  private readonly router = inject(Router);

  constructor() {
    // Keep the newest text in view while answers stream in.
    effect(() => {
      this.store.messages();
      const el = this.log()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
    // Opening moves focus into the input (keyboard and screen-reader friendly).
    effect(() => {
      if (this.store.isOpen()) queueMicrotask(() => this.input()?.nativeElement.focus());
    });
  }

  protected onInput(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  protected send(event: Event): void {
    event.preventDefault();
    this.store.ask(this.draft());
    this.draft.set('');
  }

  protected onEscape(): void {
    if (this.store.isOpen()) this.close();
  }

  protected close(): void {
    this.store.close();
    this.fab().nativeElement.focus(); // return focus where it came from
  }

  /** Citation chip: light just that node and scroll to the graph. */
  protected showNode(id: string): void {
    this.highlights.highlight([id]);
    void this.router.navigate(['/'], { fragment: 'graph' });
  }
}
