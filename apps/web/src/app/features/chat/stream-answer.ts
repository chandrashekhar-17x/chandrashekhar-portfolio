import { Observable, concat, concatMap, delay, from, of } from 'rxjs';

import { ChatEvent, ChatIntent } from '../../core/chat/chat-events';

export interface FinalAnswer {
  text: string;
  intent: ChatIntent;
  citations: string[];
  urls: string[];
}

/**
 * Streams a finished answer with the chat event contract (meta → token… → citations
 * → done), word by word, so every source feels the same as the future SSE stream.
 */
export function streamAnswer(
  answer: FinalAnswer,
  pauseMs: number,
  started: number,
): Observable<ChatEvent> {
  const words = answer.text.split(/(\s+)/); // keep whitespace so the text rebuilds exactly
  const meta: ChatEvent = { type: 'meta', messageId: crypto.randomUUID(), intent: answer.intent };
  const tokens = from(words).pipe(
    concatMap((t) => of<ChatEvent>({ type: 'token', t }).pipe(delay(pauseMs))),
  );
  const end: ChatEvent[] = [
    { type: 'citations', nodes: answer.citations, urls: answer.urls },
    { type: 'done', tokensOut: words.length, latencyMs: Date.now() - started },
  ];
  return concat(of(meta), tokens, from(end));
}
