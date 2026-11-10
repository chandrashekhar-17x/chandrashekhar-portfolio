import { Provider } from '@angular/core';

import { ChatSource } from '../../core/chat/chat-source';
import { ScriptedChatSource } from './scripted-chat.source';

/** Swap the answer source here (Phase 4: SseChatSource → POST /api/v1/chat). */
export function provideChat(): Provider[] {
  return [{ provide: ChatSource, useClass: ScriptedChatSource }];
}
