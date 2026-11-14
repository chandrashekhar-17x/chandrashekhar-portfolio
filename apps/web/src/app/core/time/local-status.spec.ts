import { hyderabadNow } from './local-status';

describe('hyderabadNow', () => {
  it('converts to IST (UTC+5:30)', () => {
    expect(hyderabadNow(new Date('2026-11-14T00:00:00Z')).time).toBe('05:30');
  });

  it('picks the status for the hour in Hyderabad', () => {
    expect(hyderabadNow(new Date('2026-11-14T20:00:00Z')).status).toContain('asleep'); // 01:30
    expect(hyderabadNow(new Date('2026-11-14T06:00:00Z')).status).toBe('deep in Angular'); // 11:30
    expect(hyderabadNow(new Date('2026-11-14T14:00:00Z')).status).toBe('learning AI engineering'); // 19:30
    expect(hyderabadNow(new Date('2026-11-14T17:00:00Z')).status).toBe('shipping side projects'); // 22:30
  });
});
