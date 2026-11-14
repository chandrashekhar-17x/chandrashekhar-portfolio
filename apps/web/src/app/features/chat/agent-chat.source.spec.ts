import { TestBed } from '@angular/core/testing';
import { firstValueFrom, toArray } from 'rxjs';

import { ChatEvent } from '../../core/chat/chat-events';
import { ChatSource } from '../../core/chat/chat-source';
import { AgentChatSource, intentOf } from './agent-chat.source';
import { provideChat } from './provide-chat';
import { CHAT_WORD_DELAY } from './scripted-chat.source';

async function askAll(question: string): Promise<ChatEvent[]> {
  const source = TestBed.inject(ChatSource);
  return firstValueFrom(source.ask(question).pipe(toArray()));
}

const textOf = (events: ChatEvent[]) => events.map((e) => (e.type === 'token' ? e.t : '')).join('');

describe('AgentChatSource (the real agent in the browser)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideChat(), { provide: CHAT_WORD_DELAY, useValue: 0 }],
    });
  });

  it('is the chat source, and not the scripted demo', () => {
    const source = TestBed.inject(ChatSource);
    expect(source).toBeInstanceOf(AgentChatSource);
    expect(source.scripted).toBe(false);
  });

  it('streams a grounded, cited answer with the chat event contract', async () => {
    const events = await askAll('Has he built a PDF viewer?');
    expect(events[0]?.type).toBe('meta');
    expect(events.at(-1)?.type).toBe('done');
    expect(textOf(events)).toMatch(/^Yes/);
    const cites = events.find((e) => e.type === 'citations');
    expect(cites?.type === 'citations' && cites.nodes.length).toBeGreaterThan(0);
  });

  it('says it does not know and points to Chandrashekhar', async () => {
    const events = await askAll('Does he know Rust?');
    expect(textOf(events)).toContain("isn't in his profile");
    expect(textOf(events)).toContain('reach out to Chandrashekhar');
  });

  it('"yes" accepts the follow-up the previous answer offered', async () => {
    const first = textOf(await askAll('who is mahesh'));
    expect(first).toContain("I don't know who Mahesh is");
    expect(textOf(await askAll('yes'))).toContain('Software Engineer');
  });

  it('after "who is Himanshu?", "what is his role" is confirmed before answering', async () => {
    await askAll('who is himanshu');
    expect(textOf(await askAll('what is his role'))).toMatch(/^Do you mean Chandrashekhar\?/);
    expect(textOf(await askAll('yes'))).toContain('Software Engineer at VassarDigital.ai');
  });

  it('maps answers to chat intents', () => {
    const base = { text: '', sources: [] };
    expect(intentOf({ ...base, kind: 'unknown', citations: [], urls: [] })).toBe('off-topic');
    expect(intentOf({ ...base, kind: 'answer', citations: ['project:x'], urls: [] })).toBe(
      'project',
    );
    expect(intentOf({ ...base, kind: 'answer', citations: [], urls: ['/recruiter'] })).toBe(
      'jd_match',
    );
  });
});
