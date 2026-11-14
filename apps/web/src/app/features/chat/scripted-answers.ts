import { ChatIntent } from '../../core/chat/chat-events';
import { Project } from '../../core/content/content.types.gen';
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

/** Sentence with a full stop, so joined fields read as prose. */
function sentence(text: string): string {
  const t = text.trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

/**
 * A question that names one of my projects ("Tell me about Progressive PDF Viewer")
 * is answered from that project's own content, citing its graph node. The longest
 * matching title wins, so "CAD Playground" never shadows a longer title.
 */
export function projectAnswer(
  question: string,
  projects: readonly Project[],
): ScriptedAnswer | null {
  const q = question.toLowerCase();
  const hit = projects
    .filter((p) => q.includes(p.title.toLowerCase()) || q.includes(p.slug))
    .sort((a, b) => b.title.length - a.title.length)[0];
  if (!hit) return null;
  const role = hit.role ? ` His role: ${sentence(hit.role)}` : '';
  return {
    keywords: [],
    intent: 'project',
    text: `${sentence(hit.summary)}${role} Built with ${hit.tags.join(', ')}. The full case study is linked below.`,
    citations: [`project:${hit.slug}`, ...hit.skills.map((s) => `skill:${s}`)],
    urls: [`/work/${hit.slug}`],
  };
}

/**
 * A named project first (see projectAnswer), then the best keyword match (most
 * keywords found), else the honest fallback.
 */
export function pickAnswer(question: string, projects: readonly Project[] = []): ScriptedAnswer {
  const named = projectAnswer(question, projects);
  if (named) return named;
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
