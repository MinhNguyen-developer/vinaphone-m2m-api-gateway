import { getBackupRunKey, isWithinBackupWindow } from './backup-window';

describe('backup-window', () => {
  it('allows Monday morning inside the Bangkok window', () => {
    const reference = new Date('2026-07-20T01:00:00Z'); // Monday 08:00 in Bangkok

    expect(isWithinBackupWindow(reference, 'Asia/Bangkok')).toBe(true);
  });

  it('rejects Sunday even when the time is inside the hour window', () => {
    const reference = new Date('2026-07-19T01:00:00Z'); // Sunday 08:00 in Bangkok

    expect(isWithinBackupWindow(reference, 'Asia/Bangkok')).toBe(false);
  });

  it('rejects the 19:00 boundary as outside the allowed window', () => {
    const reference = new Date('2026-07-20T12:00:00Z'); // Monday 19:00 in Bangkok

    expect(isWithinBackupWindow(reference, 'Asia/Bangkok')).toBe(false);
  });

  it('creates a stable backup run key in Bangkok time', () => {
    const reference = new Date('2026-07-20T01:12:00Z'); // Monday 08:12 in Bangkok

    expect(getBackupRunKey(reference, 'Asia/Bangkok')).toBe('2026-07-20-08-12');
  });
});
