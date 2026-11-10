import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { GraphHighlightService } from '../graph/graph-highlight.service';
import { ChatEvent } from './chat-events';
import { ChatSource } from './chat-source';
import { ChatStore, MAX_QUESTION_LENGTH } from './chat-store.service';

class FakeSource extends ChatSource {
  readonly scripted = true;
  asked: string[] = [];
  ask(message: string): Observable<ChatEvent> {
    this.asked.push(message);
    return of<ChatEvent[]>(
      { type: 'meta', messageId: 'x', intent: 'skills' },
      { type: 'token', t: 'Hello ' },
      { type: 'token', t: 'world' },
      { type: 'citations', nodes: ['skill:angular'], urls: [] },
      { type: 'done', tokensOut: 2, latencyMs: 1 },
    ).pipe((src) => new Observable<ChatEvent>((sub) => src.subscribe(sub)));
  }
}

describe('ChatStore', () => {
  let store: ChatStore;
  let source: FakeSource;
  let graph: GraphHighlightService;

  beforeEach(() => {
    source = new FakeSource();
    TestBed.configureTestingModule({ providers: [{ provide: ChatSource, useValue: source }] });
    store = TestBed.inject(ChatStore);
    graph = TestBed.inject(GraphHighlightService);
  });

  it('opens, adds the question and streams the answer with citations', () => {
    store.ask('  skills?  ');
    const [q, a] = store.messages();
    expect(store.isOpen()).toBe(true);
    expect(q).toMatchObject({ role: 'user', text: 'skills?' });
    expect(a).toMatchObject({
      role: 'assistant',
      text: 'Hello world',
      intent: 'skills',
      streaming: false,
    });
    expect(a?.citations).toEqual(['skill:angular']);
    expect(store.busy()).toBe(false);
  });

  it('lights up the cited graph nodes', () => {
    store.ask('skills?');
    expect([...graph.ids()]).toEqual(['skill:angular']);
  });

  it('ignores empty input and caps long input', () => {
    store.ask('   ');
    expect(store.messages()).toHaveLength(0);
    store.ask('x'.repeat(MAX_QUESTION_LENGTH + 50));
    expect(source.asked[0]?.length).toBe(MAX_QUESTION_LENGTH);
  });
});
