import { Observable } from 'rxjs';

import { ChatEvent } from './chat-events';

/**
 * Where answers come from. Phase 1: ScriptedChatSource (keyword-matched demo).
 * Phase 4: an SSE client for POST /api/v1/chat. Swap it in provideChat().
 */
export abstract class ChatSource {
  /** true while answers are scripted (the UI shows a "demo" badge). */
  abstract readonly scripted: boolean;
  abstract ask(message: string): Observable<ChatEvent>;
}
