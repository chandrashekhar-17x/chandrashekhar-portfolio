// The chat stream contract (docs/API.md → "Chat stream contract (SSE)").
// The scripted demo source and the real /api/v1/chat SSE stream emit the same events,
// so the store and UI don't change when the real agent arrives in Phase 4.

export type ChatIntent = 'about' | 'skills' | 'project' | 'jd_match' | 'contact' | 'off-topic';

export type ChatEvent =
  | { type: 'meta'; messageId: string; intent: ChatIntent }
  | { type: 'token'; t: string }
  | { type: 'citations'; nodes: string[]; urls: string[] }
  | { type: 'done'; tokensOut: number; latencyMs: number };
