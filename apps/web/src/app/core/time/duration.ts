// Durations computed from "YYYY-MM" dates, never hard-coded (content rule).
// Counting follows LinkedIn: both the start and the end month count, so
// Jan 2024 → Nov 2026 is "2 yrs 11 mos" and Aug → Dec 2023 is "5 mos".

export interface DatedRole {
  start: string; // "YYYY-MM"
  end?: string; // missing = current role
}

function monthIndex(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return (y ?? 0) * 12 + ((m ?? 1) - 1);
}

/** "YYYY-MM" for a date (the current month by default). */
export function toYearMonth(date: Date = new Date()): string {
  return `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Months covered by a role, inclusive of both ends (LinkedIn style). */
export function monthsBetween(start: string, end?: string, today = new Date()): number {
  return monthIndex(end ?? toYearMonth(today)) - monthIndex(start) + 1;
}

/** 35 → "2 yrs 11 mos"; 12 → "1 yr"; 5 → "5 mos". */
export function formatDuration(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const yrs = y ? `${String(y)} ${y === 1 ? 'yr' : 'yrs'}` : '';
  const mos = m ? `${String(m)} ${m === 1 ? 'mo' : 'mos'}` : '';
  return [yrs, mos].filter(Boolean).join(' ') || '0 mos';
}

/** Total experience as "3+ yrs": whole years from the earliest start to today. */
export function experienceYears(roles: readonly DatedRole[], today = new Date()): string {
  if (!roles.length) return '0 yrs';
  const first = roles.map((r) => r.start).sort()[0] ?? toYearMonth(today);
  const years = Math.floor(monthsBetween(first, undefined, today) / 12);
  return `${String(years)}+ yrs`;
}

// Fixed English labels: no Intl/ICU work during hydration.
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** "Jan 2024" from "2024-01". */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTH_NAMES[(m ?? 1) - 1] ?? ''} ${String(y)}`;
}
