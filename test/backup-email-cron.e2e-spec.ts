import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from '../src/config/configuration';
import { BackupScheduler } from '../src/backup/backup.scheduler';
import { BackupService } from '../src/backup/backup.service';

describe('Backup email cron (e2e)', () => {
  let scheduler: BackupScheduler;
  let backupService: {
    runScheduledBackup: jest.Mock;
  };
  let configService: ConfigService;

  beforeEach(async () => {
    process.env.BACKUP_CRON = '0 18 * * 1-6';
    process.env.BACKUP_TIMEZONE = 'Asia/Bangkok';
    process.env.BACKUP_EMAIL_TO = 'd9.fatm@gmail.com';

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

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: false, load: [configuration] })],
      providers: [
        BackupScheduler,
        {
          provide: BackupService,
          useValue: backupService,
        },
      ],
    }).compile();

    scheduler = moduleRef.get(BackupScheduler);
    configService = moduleRef.get(ConfigService);
  });

  afterEach(() => {
    delete process.env.BACKUP_CRON;
    delete process.env.BACKUP_TIMEZONE;
    delete process.env.BACKUP_EMAIL_TO;
  });

  it('exposes the cron and timezone configuration', () => {
    expect(configService.get('backup.cron')).toBe('0 18 * * 1-6');
    expect(configService.get('backup.timezone')).toBe('Asia/Bangkok');
  });

  it('skips a trigger outside the allowed window', async () => {
    const reference = new Date('2026-07-19T01:00:00Z');

    const result = await scheduler.runBackupTick(reference);

    expect(result.status).toBe('skipped');
    expect(backupService.runScheduledBackup).not.toHaveBeenCalled();
  });

  it('runs the backup service inside the allowed window', async () => {
    const reference = new Date('2026-07-20T01:00:00Z');

    const result = await scheduler.runBackupTick(reference);

    expect(result.status).toBe('completed');
    expect(backupService.runScheduledBackup).toHaveBeenCalledWith(reference);
  });
});
