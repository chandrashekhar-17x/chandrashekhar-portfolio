/** "2023-01" + no end → "2023 — now"; "2021-06" + "2022-12" → "2021 — 2022". */
export function formatPeriod(start: string, end?: string): string {
  const year = (ym: string) => ym.slice(0, 4);
  const to = end ? year(end) : 'now';
  return year(start) === to ? to : `${year(start)} — ${to}`;
}

/** Newest first; current roles (no end) before finished ones. */
export function byRecency<T extends { start: string; end?: string }>(a: T, b: T): number {
  const endA = a.end ?? '9999-12';
  const endB = b.end ?? '9999-12';
  return endB.localeCompare(endA) || b.start.localeCompare(a.start);
}
