import { Injectable, inject } from '@angular/core';
import type { Answer } from '@portfolio/agent';
import { Observable, catchError, from, switchMap } from 'rxjs';

import { ChatEvent, ChatIntent } from '../../core/chat/chat-events';
import { ChatSource } from '../../core/chat/chat-source';
import { MediaPrefs } from '../../core/motion/media-prefs.service';
import { OnDeviceAi } from './on-device-ai.service';
import { CHAT_WORD_DELAY, ScriptedChatSource } from './scripted-chat.source';
import { streamAnswer } from './stream-answer';

/** Chat intent for the UI, from what the answer cites. */
export function intentOf(answer: Answer): ChatIntent {
  if (answer.kind === 'unknown') return 'off-topic';
  if (answer.urls.includes('/recruiter')) return 'jd_match';
  if (answer.citations.some((c) => c.startsWith('project:'))) return 'project';
  if (answer.citations.some((c) => c.startsWith('skill:') || c.startsWith('hub:'))) return 'skills';
  return 'about';
}

/**
 * Real answers from the portfolio agent (packages/agent), computed in the browser
 * from content/ and the resume: grounded, cited, honest when it doesn't know.
 * If the agent chunk can't load (offline, old cached page), the scripted demo answers.
 */
@Injectable()
export class AgentChatSource extends ChatSource {
  readonly scripted = false;
  private readonly prefs = inject(MediaPrefs);
  private readonly wordDelay = inject(CHAT_WORD_DELAY);
  private readonly fallback = inject(ScriptedChatSource);
  private readonly onDevice = inject(OnDeviceAi);
  /** The follow-up the last answer offered, so a "yes" can accept it. */
  private suggest: string | undefined;
  /** The last answer was about someone else: a following "his …" gets confirmed first. */
  private lastOther: string | undefined;

  ask(message: string): Observable<ChatEvent> {
    const started = Date.now();
    const pause = this.prefs.reducedMotion() ? 0 : this.wordDelay;
    const llm = this.onDevice.client();
    const context = { suggest: this.suggest, lastOther: this.lastOther };
    return from(
      import('./agent-runtime').then(async (m) =>
        llm ? (await m.answerWithLlm(message, llm, context)).answer : m.answer(message, context),
      ),
    ).pipe(
      switchMap((a) => {
        this.suggest = a.suggest;
        this.lastOther = a.aboutOther;
        return streamAnswer(
          { text: a.text, intent: intentOf(a), citations: a.citations, urls: a.urls },
          pause,
          started,
        );
      }),
      catchError(() => this.fallback.ask(message)),
    );
  }
}
