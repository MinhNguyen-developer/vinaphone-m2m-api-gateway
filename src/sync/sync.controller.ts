import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/public.decorator';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly configService: ConfigService,
  ) {}

  /** Vercel Cron trigger — fires all jobs at once (requires CRON_SECRET). */
  @ApiExcludeEndpoint()
  @Public()
  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async trigger(@Headers('authorization') authHeader: string) {
    const secret = this.configService.get<string>('cronSecret');
    if (secret) {
      if (authHeader !== `Bearer ${secret}`) {
        throw new UnauthorizedException('Invalid cron secret');
      }
    }

    void this.syncService.syncSims();
    void this.syncService.syncRatingPlans();
    void this.syncService.syncGroupSims();

    return { triggered: true, timestamp: new Date().toISOString() };
  }

  /** Manually trigger SIM sync (fire-and-forget). */
  @ApiOperation({ summary: 'Trigger SIM sync from Vinaphone API' })
  @Post('sims')
  @HttpCode(HttpStatus.OK)
  triggerSims() {
    void this.syncService.syncSims();
    return { triggered: true, job: 'syncSims', timestamp: new Date().toISOString() };
  }

  /** Manually trigger rating plan sync (fire-and-forget). */
  @ApiOperation({ summary: 'Trigger rating plan sync from Vinaphone API' })
  @Post('rating-plans')
  @HttpCode(HttpStatus.OK)
  triggerRatingPlans() {
    void this.syncService.syncRatingPlans();
    return { triggered: true, job: 'syncRatingPlans', timestamp: new Date().toISOString() };
  }

  /** Manually trigger group SIM sync (fire-and-forget). */
  @ApiOperation({ summary: 'Trigger group SIM sync from Vinaphone API' })
  @Post('group-sims')
  @HttpCode(HttpStatus.OK)
  triggerGroupSims() {
    void this.syncService.syncGroupSims();
    return { triggered: true, job: 'syncGroupSims', timestamp: new Date().toISOString() };
  }
}
