import { ChatIntent } from '../../core/chat/chat-events';
import { SCRIPTED_ANSWERS } from './scripted-answers.data';

// Matching logic for the scripted chat. The answers live in scripted-answers.data.ts.

export interface ScriptedAnswer {
  keywords: string[];
  intent: ChatIntent;
  text: string;
  citations: string[];
  urls?: string[];
}

export { SCRIPTED_ANSWERS };

export const FALLBACK_ANSWER: ScriptedAnswer = {
  keywords: [],
  intent: 'off-topic',
  text: "That isn't in his profile, so I won't guess. You can ask him directly through the contact form, or ask about his skills, projects or AI work.",
  citations: [],
};

export const SUGGESTED_QUESTIONS: readonly string[] = [
  'Who is Chandrashekhar?',
  'What are his key skills?',
  "What's his biggest project?",
  'Why build a custom CAD editor?',
  'How is AI used here?',
  'Does he fit an Angular + AI role? (JD match)',
  'How is this site built?',
];

/** Best keyword match (most keywords found), else the honest fallback. */
export function pickAnswer(question: string): ScriptedAnswer {
  const q = question.toLowerCase();
  let best = FALLBACK_ANSWER;
  let bestScore = 0;
  for (const a of SCRIPTED_ANSWERS) {
    const score = a.keywords.filter((k) => new RegExp(`\\b${k}`).test(q)).length;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}
