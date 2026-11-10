import { byRecency, formatEmployment, formatPeriod } from './format-period';

describe('formatPeriod', () => {
  it('formats current and finished roles with LinkedIn-style durations', () => {
    const nov2026 = new Date(2026, 10, 10);
    expect(formatPeriod('2024-01', undefined, nov2026)).toBe('Jan 2024 – Present · 2 yrs 11 mos');
    expect(formatPeriod('2023-08', '2023-12')).toBe('Aug 2023 – Dec 2023 · 5 mos');
  });

  it('labels employment type and workplace', () => {
    expect(formatEmployment('full-time', 'on-site')).toBe('Full-time · On-site');
    expect(formatEmployment('internship')).toBe('Internship');
  });
});

describe('byRecency', () => {
  it('puts current roles first, then by most recent end and start', () => {
    const roles = [
      { id: 'old', start: '2019-01', end: '2020-01' },
      { id: 'now-older', start: '2021-01' },
      { id: 'mid', start: '2020-02', end: '2022-12' },
      { id: 'now-newer', start: '2024-01' },
    ];
    expect([...roles].sort(byRecency).map((r) => r.id)).toEqual([
      'now-newer',
      'now-older',
      'mid',
      'old',
    ]);
  });
});
