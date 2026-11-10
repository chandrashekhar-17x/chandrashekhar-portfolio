// Typing effect state machine (prototype: hero "I build …" line).
// Pure: given the current state, returns the next state + how long to wait.

export interface TypeState {
  index: number; // which phrase
  chars: number; // how many characters are shown
  deleting: boolean;
}

export interface TypeStep {
  state: TypeState;
  text: string;
  delayMs: number;
}

export const TYPE_DELAYS = { type: 55, hold: 1500, erase: 25, next: 300 } as const;

export function nextTypeStep(phrases: readonly string[], s: TypeState): TypeStep {
  const phrase = phrases[s.index] ?? '';
  let next: TypeState;
  let delayMs: number;

  if (!s.deleting && s.chars < phrase.length) {
    next = { ...s, chars: s.chars + 1 };
    delayMs = TYPE_DELAYS.type;
  } else if (!s.deleting) {
    next = { ...s, deleting: true }; // full phrase shown: hold it
    delayMs = TYPE_DELAYS.hold;
  } else if (s.chars > 0) {
    next = { ...s, chars: s.chars - 1 };
    delayMs = TYPE_DELAYS.erase;
  } else {
    next = { index: (s.index + 1) % Math.max(phrases.length, 1), chars: 0, deleting: false };
    delayMs = TYPE_DELAYS.next;
  }
  const shown = phrases[next.index] ?? '';
  return { state: next, text: shown.slice(0, next.chars), delayMs };
}
