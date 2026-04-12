import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncService } from './sync.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        timeout: config.get<number>('vinaphone.timeoutMs') ?? 10000,
        baseURL: config.get<string>('vinaphone.baseUrl'),
        headers: {
          'x-api-key': config.get<string>('vinaphone.apiKey') ?? '',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
