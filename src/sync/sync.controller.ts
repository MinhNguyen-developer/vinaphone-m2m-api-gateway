import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { SyncService } from './sync.service';

/**
 * Endpoint invoked by Vercel Cron Jobs (and optionally manually).
 *
 * Vercel sends:  Authorization: Bearer <CRON_SECRET>
 * Set CRON_SECRET in Vercel project environment variables.
 *
 * vercel.json schedule:  "0 * * * *"  (every hour)
 */
@ApiExcludeController()
@Public()
@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly configService: ConfigService,
  ) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async trigger(@Headers('authorization') authHeader: string) {
    const secret = this.configService.get<string>('cronSecret');

    // Only enforce auth when CRON_SECRET is configured
    if (secret) {
      const expected = `Bearer ${secret}`;
      if (authHeader !== expected) {
        throw new UnauthorizedException('Invalid cron secret');
      }
    }

    // Fire-and-forget: return immediately so Vercel does not time out (max 60s)
    void this.syncService.syncSims();
    void this.syncService.syncRatingPlans();

    return { triggered: true, timestamp: new Date().toISOString() };
  }
}
