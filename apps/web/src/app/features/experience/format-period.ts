import { formatDuration, formatMonth, monthsBetween } from '../../core/time/duration';

/** "2024-01" + no end → "Jan 2024 – Present · 2 yrs 11 mos" (LinkedIn style). */
export function formatPeriod(start: string, end?: string, today = new Date()): string {
  const range = `${formatMonth(start)} – ${end ? formatMonth(end) : 'Present'}`;
  return `${range} · ${formatDuration(monthsBetween(start, end, today))}`;
}

const EMPLOYMENT: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
  freelance: 'Freelance',
};

/** "Full-time · On-site" from the role's employment type and workplace. */
export function formatEmployment(type: string, workplace?: string): string {
  const where = workplace ? workplace.charAt(0).toUpperCase() + workplace.slice(1) : '';
  return [EMPLOYMENT[type] ?? type, where].filter(Boolean).join(' · ');
}

/** Newest first; current roles (no end) before finished ones. */
export function byRecency<T extends { start: string; end?: string }>(a: T, b: T): number {
  const endA = a.end ?? '9999-12';
  const endB = b.end ?? '9999-12';
  return endB.localeCompare(endA) || b.start.localeCompare(a.start);
}
