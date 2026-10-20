import {
  Controller,
  Get,
  MessageEvent,
  Post,
  Sse,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Observable, concat, interval, map, merge, of } from 'rxjs';
import { Public } from '../auth/public.decorator';
import {
  SyncService,
  type SyncJobName,
  type SyncJobStatus,
} from './sync.service';

@ApiTags('Sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly configService: ConfigService,
  ) {}

  @Get('status')
  getStatus(): Record<SyncJobName, SyncJobStatus> {
    return this.syncService.getSyncStatus();
  }

  @Sse('events')
  getStatusEvents(): Observable<MessageEvent> {
    return concat(
      of({ type: 'sync-status', data: this.syncService.getSyncStatus() }),
      merge(
        this.syncService
          .watchSyncStatus()
          .pipe(map((data) => ({ type: 'sync-status', data }))),
        interval(15_000).pipe(map(() => ({ type: 'ping', data: 'keepalive' }))),
      ),
    );
  }

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
    return {
      triggered: true,
      job: 'syncSims',
      timestamp: new Date().toISOString(),
    };
  }

  /** Manually trigger rating plan sync (fire-and-forget). */
  @ApiOperation({ summary: 'Trigger rating plan sync from Vinaphone API' })
  @Post('rating-plans')
  @HttpCode(HttpStatus.OK)
  triggerRatingPlans() {
    void this.syncService.syncRatingPlans();
    return {
      triggered: true,
      job: 'syncRatingPlans',
      timestamp: new Date().toISOString(),
    };
  }

  /** Manually trigger group SIM sync (fire-and-forget). */
  @ApiOperation({ summary: 'Trigger group SIM sync from Vinaphone API' })
  @Post('group-sims')
  @HttpCode(HttpStatus.OK)
  triggerGroupSims() {
    void this.syncService.syncGroupSims();
    return {
      triggered: true,
      job: 'syncGroupSims',
      timestamp: new Date().toISOString(),
    };
  }

  /** Trigger monthly usage sync via detail-plan API (fire-and-forget). */
  @ApiOperation({
    summary:
      'Trigger monthly usage sync (detail-plan). Rate-limited — run manually.',
  })
  @Post('monthly-usage')
  @HttpCode(HttpStatus.OK)
  triggerMonthlyUsage() {
    void this.syncService.syncMonthlyUsage().catch(() => undefined);
    return {
      triggered: true,
      job: 'syncMonthlyUsage',
      timestamp: new Date().toISOString(),
    };
  }
}
