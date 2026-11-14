import { timeAgo } from './time-ago';

describe('timeAgo', () => {
  const now = new Date('2026-11-14T12:00:00Z');
  const ago = (ms: number) => timeAgo(new Date(now.getTime() - ms), now);

  it('reads naturally at every scale', () => {
    expect(ago(20_000)).toBe('just now');
    expect(ago(5 * 60_000)).toBe('5 min ago');
    expect(ago(3 * 3_600_000)).toBe('3 h ago');
    expect(ago(30 * 3_600_000)).toBe('yesterday');
    expect(ago(5 * 86_400_000)).toBe('5 days ago');
  });

  it('treats clock skew (a future date) as just now', () => {
    expect(ago(-60_000)).toBe('just now');
  });
});
