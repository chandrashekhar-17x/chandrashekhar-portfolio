import { byRecency, formatPeriod } from './format-period';

describe('formatPeriod', () => {
  it('formats current, finished and single-year periods', () => {
    expect(formatPeriod('2023-01')).toBe('2023 — now');
    expect(formatPeriod('2021-06', '2022-12')).toBe('2021 — 2022');
    expect(formatPeriod('2022-01', '2022-09')).toBe('2022');
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
