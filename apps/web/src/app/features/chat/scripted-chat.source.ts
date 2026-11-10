import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, concat, concatMap, delay, from, of } from 'rxjs';

import { ChatEvent } from '../../core/chat/chat-events';
import { ChatSource } from '../../core/chat/chat-source';
import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { pickAnswer } from './scripted-answers';

/** Delay between streamed words (ms). Tests set 0. */
export const CHAT_WORD_DELAY = new InjectionToken<number>('CHAT_WORD_DELAY', {
  factory: () => 18,
});

/**
 * Demo answers that *behave* like the real agent: same events, streamed word by word
 * (meta → token… → citations → done). Phase 4 replaces this with the SSE client.
 */
@Injectable()
export class ScriptedChatSource extends ChatSource {
  readonly scripted = true;
  private readonly prefs = inject(MediaPrefs);
  private readonly wordDelay = inject(CHAT_WORD_DELAY);

  ask(message: string): Observable<ChatEvent> {
    const started = Date.now();
    const answer = pickAnswer(message);
    const words = answer.text.split(/(\s+)/); // keep whitespace so the text rebuilds exactly
    const pause = this.prefs.reducedMotion() ? 0 : this.wordDelay;

    const meta: ChatEvent = { type: 'meta', messageId: crypto.randomUUID(), intent: answer.intent };
    const tokens = from(words).pipe(
      concatMap((t) => of<ChatEvent>({ type: 'token', t }).pipe(delay(pause))),
    );
    const end: ChatEvent[] = [
      { type: 'citations', nodes: answer.citations, urls: answer.urls ?? [] },
      { type: 'done', tokensOut: words.length, latencyMs: Date.now() - started },
    ];
    return concat(of(meta), tokens, from(end));
  }
}
