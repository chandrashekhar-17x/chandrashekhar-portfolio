import { experienceYears, formatDuration, formatMonth, monthsBetween } from './duration';

const NOV_2026 = new Date(2026, 10, 10);

describe('durations (LinkedIn-style, inclusive months)', () => {
  it('matches the LinkedIn profile for each role', () => {
    // VassarDigital.ai: Jan 2024 – Present (Nov 2026) → "2 yrs 11 mos"
    expect(formatDuration(monthsBetween('2024-01', undefined, NOV_2026))).toBe('2 yrs 11 mos');
    // Vassar Labs full-time: Aug – Dec 2023 → "5 mos"; internship Jan – Jul 2023 → "7 mos"
    expect(formatDuration(monthsBetween('2023-08', '2023-12'))).toBe('5 mos');
    expect(formatDuration(monthsBetween('2023-01', '2023-07'))).toBe('7 mos');
    // Vassar Labs total: Jan – Dec 2023 → "1 yr"
    expect(formatDuration(monthsBetween('2023-01', '2023-12'))).toBe('1 yr');
  });

  it('computes total experience from the earliest start ("3+ yrs" since Jan 2023)', () => {
    const roles = [
      { start: '2024-01' },
      { start: '2023-08', end: '2023-12' },
      { start: '2023-01', end: '2023-07' },
    ];
    expect(experienceYears(roles, NOV_2026)).toBe('3+ yrs');
    expect(experienceYears(roles, new Date(2025, 11, 1))).toBe('3+ yrs'); // Dec 2025: 36 months
    expect(experienceYears(roles, new Date(2025, 10, 1))).toBe('2+ yrs'); // Nov 2025: 35 months
  });

  it('handles "Present" by using today', () => {
    expect(monthsBetween('2026-11', undefined, NOV_2026)).toBe(1);
  });

  it('formats singular units and months', () => {
    expect(formatDuration(13)).toBe('1 yr 1 mo');
    expect(formatMonth('2024-01')).toBe('Jan 2024');
  });
});
