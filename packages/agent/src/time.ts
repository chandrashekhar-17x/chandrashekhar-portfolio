import { monthLabel } from './text';

// Time constraints in a question → an inclusive month range ("YYYY-MM").
// "in 2025", "during Jan 2023", "after 2024", "since 2024", "before 2025",
// "between 2023 and 2024", "last year", "this year", "now".

export interface Range {
  from: string;
  to: string;
  /** How to say it back: "in 2025", "since 2024", "in Jan 2023". */
  label: string;
}

const MONTHS: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};
const MONTH = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?';

export function parseRange(text: string, today: string): Range | null {
  const t = text.toLowerCase();
  const [ty = '2000'] = today.split('-');
  const year = (y: string, label: string): Range => ({ from: `${y}-01`, to: `${y}-12`, label });

  let m = /\bbetween\s+(\d{4})\s+and\s+(\d{4})\b/.exec(t);
  if (m)
    return {
      from: `${m[1] ?? ''}-01`,
      to: `${m[2] ?? ''}-12`,
      label: `between ${m[1] ?? ''} and ${m[2] ?? ''}`,
    };

  m = new RegExp(`\\b${MONTH}\\s+(\\d{4})\\b`).exec(t);
  if (m) {
    const ym = `${m[2] ?? ''}-${MONTHS[m[1] ?? ''] ?? '01'}`;
    return { from: ym, to: ym, label: `in ${monthLabel(ym)}` };
  }
  m = /\b(after|since|from)\s+(\d{4})\b/.exec(t);
  if (m) {
    const y = Number(m[2]);
    const from = m[1] === 'after' ? String(y + 1) : String(y);
    return {
      from: `${from}-01`,
      to: today,
      label: `${m[1] === 'after' ? 'after' : 'since'} ${String(y)}`,
    };
  }
  m = /\bbefore\s+(\d{4})\b/.exec(t);
  if (m)
    return { from: '1900-01', to: `${String(Number(m[1]) - 1)}-12`, label: `before ${m[1] ?? ''}` };

  m = /\b(19|20)(\d{2})\b/.exec(t);
  if (m) return year(`${m[1] ?? ''}${m[2] ?? ''}`, `in ${m[1] ?? ''}${m[2] ?? ''}`);

  if (/\blast year\b/.test(t)) return year(String(Number(ty) - 1), 'last year');
  if (/\bthis year\b/.test(t)) return year(ty, 'this year');
  return null;
}

/** Does [start, end] (end missing = ongoing until today) overlap the range? */
export function overlaps(start: string, end: string | undefined, r: Range, today: string): boolean {
  return start <= r.to && (end ?? today) >= r.from;
}

/** "2024" → "2024-01" (start) / "2024-12" (end); "2024-07" stays. */
export function toMonth(value: string, edge: 'start' | 'end'): string {
  return value.length === 4 ? `${value}-${edge === 'start' ? '01' : '12'}` : value;
}
