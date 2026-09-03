import { ConfigService } from '@nestjs/config';
import { BackupScheduler } from './backup.scheduler';

describe('BackupScheduler', () => {
  let backupService: {
    runScheduledBackup: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let scheduler: BackupScheduler;

  beforeEach(() => {
    backupService = {
      runScheduledBackup: jest.fn().mockResolvedValue({
        runKey: '2026-07-20-08-00',
        status: 'completed',
        startedAt: new Date('2026-07-20T01:00:00Z'),
        finishedAt: new Date('2026-07-20T01:05:00Z'),
        artifact: {
          filePath: '/tmp/backup.dump',
          fileName: 'backup.dump',
          sizeBytes: 128,
          createdAt: new Date('2026-07-20T01:02:00Z'),
        },
        emailMessageId: 'message-id',
      }),
    };

    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'backup.timezone':
            return 'Asia/Bangkok';
          default:
            return undefined;
        }
      }),
    };

    scheduler = new BackupScheduler(
      backupService as any,
      configService as unknown as ConfigService,
    );
  });

  it('invokes the backup service inside the allowed window', async () => {
    const reference = new Date('2026-07-20T01:00:00Z');

    await scheduler.runBackupTick(reference);

    expect(backupService.runScheduledBackup).toHaveBeenCalledWith(reference);
  });

  it('skips Sunday triggers', async () => {
    const reference = new Date('2026-07-19T01:00:00Z');

    const result = await scheduler.runBackupTick(reference);

    expect(result.status).toBe('skipped');
    expect(backupService.runScheduledBackup).not.toHaveBeenCalled();
  });

  it('skips triggers outside the allowed hours', async () => {
    const reference = new Date('2026-07-20T12:00:00Z');

    const result = await scheduler.runBackupTick(reference);

    expect(result.status).toBe('skipped');
    expect(backupService.runScheduledBackup).not.toHaveBeenCalled();
  });
});
