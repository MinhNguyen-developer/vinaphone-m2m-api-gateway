import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { BackupScheduler } from './backup.scheduler';
import { BackupService } from './backup.service';

@Module({
  imports: [NotificationsModule],
  providers: [BackupService, BackupScheduler],
  exports: [BackupService, BackupScheduler],
})
export class BackupModule {}
