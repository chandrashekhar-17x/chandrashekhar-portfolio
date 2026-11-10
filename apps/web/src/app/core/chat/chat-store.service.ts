import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';

import { GraphHighlightService } from '../graph/graph-highlight.service';
import { ChatEvent, ChatIntent } from './chat-events';
import { ChatSource } from './chat-source';

export const MAX_QUESTION_LENGTH = 500; // docs/agents.md → guardrails

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  intent?: ChatIntent;
  citations: string[];
  streaming: boolean;
}

/**
 * Chat state as signals: open/closed, messages, streaming.
 * Anything can open the chat or ask a question (hero CTA, graph nodes, mic demo)
 * without depending on the widget's code, which loads lazily.
 */
@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly source = inject(ChatSource);
  private readonly graph = inject(GraphHighlightService);
  private readonly list = signal<ChatMessage[]>([]);
  private stream?: Subscription;
  private seq = 0;

  readonly messages = this.list.asReadonly();
  readonly isOpen = signal(false);
  readonly busy = signal(false);
  readonly scripted = this.source.scripted;

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    this.isOpen.update((o) => !o);
  }

  /** Opens the chat and asks. Long input is trimmed; empty input is ignored. */
  ask(question: string): void {
    const text = question.trim().slice(0, MAX_QUESTION_LENGTH);
    if (!text) return;
    this.open();
    this.stream?.unsubscribe(); // a new question interrupts the current answer

    this.push({ role: 'user', text });
    const reply = this.push({ role: 'assistant', text: '', streaming: true });
    this.busy.set(true);

    this.stream = this.source.ask(text).subscribe({
      next: (event) => {
        this.apply(reply, event);
      },
      error: () => {
        this.patch(reply, {
          text: 'Sorry, something went wrong. Please try again.',
          streaming: false,
        });
        this.busy.set(false);
      },
      complete: () => {
        this.patch(reply, { streaming: false });
        this.busy.set(false);
      },
    });
  }

  private apply(id: string, event: ChatEvent): void {
    switch (event.type) {
      case 'meta':
        this.patch(id, { intent: event.intent });
        break;
      case 'token':
        this.list.update((all) =>
          all.map((m) => (m.id === id ? { ...m, text: m.text + event.t } : m)),
        );
        break;
      case 'citations':
        this.patch(id, { citations: event.nodes });
        if (event.nodes.length) this.graph.highlight(event.nodes); // light up the graph
        break;
      case 'done':
        this.patch(id, { streaming: false });
        break;
    }
  }

  private push(m: Pick<ChatMessage, 'role' | 'text'> & Partial<ChatMessage>): string {
    const id = `m${String(++this.seq)}`;
    this.list.update((all) => [...all, { citations: [], streaming: false, ...m, id }]);
    return id;
  }

  private patch(id: string, changes: Partial<ChatMessage>): void {
    this.list.update((all) => all.map((m) => (m.id === id ? { ...m, ...changes } : m)));
  }
}
