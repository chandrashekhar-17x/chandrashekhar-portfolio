import { Injectable, inject } from '@angular/core';
import type { Answer } from '@portfolio/agent';
import { Observable, catchError, from, switchMap } from 'rxjs';

import { ChatEvent, ChatIntent } from '../../core/chat/chat-events';
import { ChatSource } from '../../core/chat/chat-source';
import { MediaPrefs } from '../../core/motion/media-prefs.service';
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

  ask(message: string): Observable<ChatEvent> {
    const started = Date.now();
    const pause = this.prefs.reducedMotion() ? 0 : this.wordDelay;
    return from(import('./agent-runtime').then((m) => m.answer(message))).pipe(
      switchMap((a) =>
        streamAnswer(
          { text: a.text, intent: intentOf(a), citations: a.citations, urls: a.urls },
          pause,
          started,
        ),
      ),
      catchError(() => this.fallback.ask(message)),
    );
  }
}
