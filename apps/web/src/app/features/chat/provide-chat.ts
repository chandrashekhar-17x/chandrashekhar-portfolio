import { Provider } from '@angular/core';

import { ChatSource } from '../../core/chat/chat-source';
import { AgentChatSource } from './agent-chat.source';
import { ScriptedChatSource } from './scripted-chat.source';

/** The portfolio agent answers; the scripted demo is its offline fallback. */
export function provideChat(): Provider[] {
  return [ScriptedChatSource, { provide: ChatSource, useClass: AgentChatSource }];
}
