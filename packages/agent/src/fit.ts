import { joinAnd } from './answer';
import type { AgentIndex, Query } from './retrieve';
import type { Answer } from './types';

// "Is he good for an AI engineer role?" The agent gives no opinions: it lays out
// the evidence for the role's skill areas from my data, with proficiency stated
// honestly (production vs learning), and points to the JD match for details.

export const FIT =
  /\b(good|fit|suitable|right|ready|qualified|hire|hiring|recommend)\b.*\b(role|job|position|engineer|developer|team|company)\b|\bwhat do you think\b|\byour opinion\b|\bshould (we|i) hire\b|\bstrong candidate\b/i;

/** Role words → skill categories in skills.json. */
const AREAS: readonly [RegExp, string][] = [
  [/\b(ai|ml|llm|genai|machine learning|rag|agent)\b/i, 'ai'],
  [/\b(backend|back-end|python|django|fastapi|api|full ?stack)\b/i, 'backend'],
  [/\b(frontend|front-end|angular|ui|web|full ?stack)\b/i, 'frontend'],
  [/\b(cad|3d|graphics|webgl|three)\b/i, 'cad'],
  [/\b(pdf|document)\b/i, 'documents'],
];

const LABEL: Record<string, string> = {
  ai: 'AI',
  backend: 'backend',
  frontend: 'frontend',
  cad: 'CAD & 3D',
  documents: 'document tooling',
};

export function fitAnswer(index: AgentIndex, q: Query): Answer | null {
  if (!FIT.test(q.text)) return null;
  const areas = AREAS.filter(([re]) => re.test(q.text)).map(([, a]) => a);
  const asked = areas.length ? [...new Set(areas)] : ['frontend', 'cad', 'documents'];
  const skills = index.skillsByCategory;

  const parts: string[] = [];
  const citations: string[] = [];
  for (const area of asked) {
    const list = skills.get(area) ?? [];
    const strong = list.filter((s) => s.proficiency === 'strong' || s.proficiency === 'good');
    const learning = list.filter((s) => s.proficiency === 'learning');
    const name = LABEL[area] ?? area;
    if (strong.length) {
      parts.push(
        `in ${name} he has production experience with ${joinAnd(strong.slice(0, 6).map((s) => s.name))}`,
      );
    }
    if (learning.length) {
      parts.push(
        `in ${name} he is learning ${joinAnd(learning.slice(0, 6).map((s) => s.name))} (no production experience yet)`,
      );
    }
    citations.push(
      `hub:${area}`,
      ...[...strong, ...learning].slice(0, 3).map((s) => `skill:${s.id}`),
    );
  }
  const ai = asked.includes('ai')
    ? ' He is building this portfolio’s AI agent in public as hands-on AI work.'
    : '';
  return {
    kind: 'answer',
    text:
      `I don't give opinions, only what his profile shows. He has ${index.years}+ years of production frontend work ` +
      `(Angular, a custom Three.js CAD editor, PDF tooling, real-time UIs). For this role, ${parts.join('; ')}.${ai} ` +
      'For a skill-by-skill match, paste the job description into the 30-second view.',
    citations: [...new Set(citations)].slice(0, 6),
    urls: ['/recruiter', ...(asked.includes('ai') ? ['/work/portfolio-rag-agent'] : [])],
    sources: [],
  };
}
