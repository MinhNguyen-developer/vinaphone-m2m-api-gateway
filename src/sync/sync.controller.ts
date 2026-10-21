import {
  Controller,
  Get,
  MessageEvent,
  Post,
  Sse,
  Headers,
  Request,
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
import { Observable, concat, from, interval, map, merge } from 'rxjs';
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
  getStatus(@Request() req: { user: { accountId: string } }): Promise<Record<SyncJobName, SyncJobStatus>> {
    return this.syncService.getSyncStatus(req.user.accountId);
  }

  @Sse('events')
  getStatusEvents(@Request() req: { user: { accountId: string } }): Observable<MessageEvent> {
    const accountId = req.user.accountId;
    return concat(
      from(this.syncService.getSyncStatus(accountId)).pipe(
        map((data) => ({ type: 'sync-status', data })),
      ),
      merge(
        this.syncService
          .watchSyncStatus(accountId)
          .pipe(map((data) => ({ type: 'sync-status', data }))),
        interval(15_000).pipe(map(() => ({ type: 'ping', data: 'keepalive' }))),
      ),
    );
  }

  /** Dispatch all eligible accounts sequentially (requires CRON_SECRET). */
  @ApiExcludeEndpoint()
  @Public()
  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async trigger(@Headers('authorization') authHeader: string) {
    const secret = this.configService.get<string>('cronSecret');
    if (!secret || authHeader !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Invalid cron secret');
    }

    void this.syncService.syncEligibleAccounts().catch(() => undefined);

    return { triggered: true, timestamp: new Date().toISOString() };
  }

  /** Manually trigger SIM sync (fire-and-forget). */
  @ApiOperation({ summary: 'Trigger SIM sync from Vinaphone API' })
  @Post('sims')
  @HttpCode(HttpStatus.OK)
  triggerSims(@Request() req: { user: { accountId: string } }) {
    void this.syncService.syncSims(req.user.accountId);
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
  triggerRatingPlans(@Request() req: { user: { accountId: string } }) {
    void this.syncService.syncRatingPlans(req.user.accountId);
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
  triggerGroupSims(@Request() req: { user: { accountId: string } }) {
    void this.syncService.syncGroupSims(req.user.accountId);
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
  triggerMonthlyUsage(@Request() req: { user: { accountId: string } }) {
    void this.syncService
      .syncMonthlyUsage(req.user.accountId)
      .catch(() => undefined);
    return {
      triggered: true,
      job: 'syncMonthlyUsage',
      timestamp: new Date().toISOString(),
    };
  }
}
