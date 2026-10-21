import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AlertsModule,
    AuthModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        timeout: config.get<number>('vinaphone.timeoutMs') ?? 1000,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
