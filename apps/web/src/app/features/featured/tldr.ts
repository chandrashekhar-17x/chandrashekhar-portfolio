/**
 * First `max` bullets of the "## TL;DR" section of a case study, as plain text
 * (markdown bold/italics removed). The band stays in sync with the case study.
 */
export function tldrBullets(md: string, max = 3): string[] {
  const heading = /^## TL;DR[\t ]*\r?\n/m.exec(md);
  if (!heading) return [];
  const section = md.slice(heading.index + heading[0].length).split(/^## /m)[0] ?? '';
  return section
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) =>
      line
        .slice(2)
        .replace(/\*\*|__|\*/g, '')
        .trim(),
    )
    .slice(0, max);
}

export interface JourneyStep {
  label: string; // "Approach 1: backend + frontend rendering"
  outcome: '✗' | '◐' | '✓';
  /** CSS modifier and screen-reader text for the marker. */
  kind: 'no' | 'part' | 'ok';
  spoken: string;
}

const OUTCOMES = {
  '✗': { kind: 'no', spoken: 'dropped' },
  '◐': { kind: 'part', spoken: 'partly worked' },
  '✓': { kind: 'ok', spoken: 'shipped' },
} as const;

/** The "Approach N: … · ✗/◐/✓" steps of a case study's R&D journey, in order. */
export function journeySteps(md: string): JourneyStep[] {
  const steps: JourneyStep[] = [];
  for (const m of md.matchAll(/\*\*(Approach \d+:[^*]+)\*\*\s*·\s*(✗|◐|✓)/g)) {
    const outcome = m[2] as JourneyStep['outcome'];
    steps.push({ label: (m[1] ?? '').trim(), outcome, ...OUTCOMES[outcome] });
  }
  return steps;
}
