import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupRunResult, BackupRunSkipped } from './backup.types';
import { getBackupRunKey, isWithinBackupWindow } from './backup-window';

@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(process.env.BACKUP_CRON || '0 18 * * 1-6', {
    timeZone: process.env.BACKUP_TIMEZONE || 'Asia/Bangkok',
  })
  async handleBackupCron(): Promise<BackupRunResult> {
    return this.runBackupTick();
  }

  async runBackupTick(triggeredAt = new Date()): Promise<BackupRunResult> {
    const timezone = this.configService.get<string>('backup.timezone') || 'Asia/Bangkok';
    const runKey = getBackupRunKey(triggeredAt, timezone);

    if (!isWithinBackupWindow(triggeredAt, timezone)) {
      const skipped: BackupRunSkipped = {
        runKey,
        status: 'skipped',
        reason: 'outside allowed operating window',
        startedAt: triggeredAt,
        finishedAt: new Date(),
      };
      this.logger.log(
        `Backup cron tick skipped for ${runKey} because it is outside the allowed window`,
      );
      return skipped;
    }

    return this.backupService.runScheduledBackup(triggeredAt);
  }
}
