import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ChatEvent } from '../../core/chat/chat-events';
import { ChatSource } from '../../core/chat/chat-source';
import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { MOCK_GRAPH_INPUT } from '../../core/content/mock-content.repository';
import { pickAnswer } from './scripted-answers';
import { streamAnswer } from './stream-answer';

/** Delay between streamed words (ms). Tests set 0. */
export const CHAT_WORD_DELAY = new InjectionToken<number>('CHAT_WORD_DELAY', {
  factory: () => 18,
});

/**
 * Demo answers that *behave* like the real agent: same events, streamed word by word
 * (meta → token… → citations → done). Now the offline fallback of AgentChatSource.
 */
@Injectable()
export class ScriptedChatSource extends ChatSource {
  readonly scripted = true;
  private readonly prefs = inject(MediaPrefs);
  private readonly wordDelay = inject(CHAT_WORD_DELAY);

  ask(message: string): Observable<ChatEvent> {
    const answer = pickAnswer(message, MOCK_GRAPH_INPUT.projects);
    const pause = this.prefs.reducedMotion() ? 0 : this.wordDelay;
    return streamAnswer(
      {
        text: answer.text,
        intent: answer.intent,
        citations: answer.citations,
        urls: answer.urls ?? [],
      },
      pause,
      Date.now(),
    );
  }
}
