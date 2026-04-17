import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import type {
  VinaphoneLoginResponse,
  QuickSearchSimItem,
  SogItem,
  MemberOfGrResponse,
  VinaphoneApiBaseResponse,
  RatingPlanItem,
} from './vinaphone-api.types';

/** Parse the `sog` JSON string, returning the first entry or null */
function parseSog(sogRaw: string | null | undefined): SogItem | null {
  if (!sogRaw) return null;
  try {
    const arr = JSON.parse(sogRaw) as SogItem[];
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
  } catch {
    return null;
  }
}

/** Map numeric status from Vinaphone to internal status string */
function mapSimStatus(code: number): string {
  switch (code) {
    case 1:
      return 'Mới';
    case 2:
      return 'Đang hoạt động';
    case 3:
      return 'Tạm khoá';
    case 4:
      return 'Huỷ';
    default:
      return String(code);
  }
}

/**
 * Normalise MSISDN from Vinaphone API (E.164 without '+', e.g. 84912345678 or 841388111909)
 * to local DB format (e.g. 0912345678 or 01388111909).
 * Simply replace the '84' country prefix with '0'.
 */
function normalizeMsisdn(msisdn: number | string): string {
  const raw = String(msisdn);
  if (raw.startsWith('84')) {
    return '0' + raw.slice(2);
  }
  return raw;
}

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0; // Unix timestamp (seconds)
  private isSyncing = false; // guard against overlapping runs

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression =
      this.configService.get<string>('syncCron') ?? CronExpression.EVERY_MINUTE;
    const syncSimJob = new CronJob(cronExpression, () => void this.syncSims());
    this.schedulerRegistry.addCronJob('syncSims', syncSimJob);
    const syncRatingPlansJob = new CronJob(
      cronExpression,
      () => void this.syncRatingPlans(),
    );
    this.schedulerRegistry.addCronJob('syncRatingPlans', syncRatingPlansJob);
    syncSimJob.start();
    syncRatingPlansJob.start();
    this.logger.log(`Sync cron scheduled: ${cronExpression}`);
  }

  // ─── Token management ──────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    const nowSec = Math.floor(Date.now() / 1000);
    if (this.cachedToken && nowSec < this.tokenExpiresAt - 60) {
      return this.cachedToken;
    }

    const baseUrl = this.configService.get<string>('vinaphone.baseUrl')!;
    const email = this.configService.get<string>('vinaphone.email');
    const password = this.configService.get<string>('vinaphone.password');

    if (!email || !password) {
      throw new Error(
        'Vinaphone credentials not configured. Set VINAPHONE_API_EMAIL and VINAPHONE_API_PASSWORD in .env',
      );
    }

    const loginUrl = `${baseUrl}/auth/token`;
    this.logger.log(`Authenticating at ${loginUrl}`);

    const { data } = await firstValueFrom(
      this.httpService.post<VinaphoneLoginResponse>(loginUrl, {
        email,
        password,
        rememberMe: true,
      }),
    );

    this.cachedToken = data.id_token;
    this.tokenExpiresAt = data.exp;
    this.logger.log('Vinaphone token refreshed');
    return this.cachedToken;
  }

  private authHeaders(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  // ─── Sync entry point ──────────────────────────────────────────────────────

  async syncSims() {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress — skipping this cron tick');
      return;
    }
    this.isSyncing = true;
    this.logger.log('Starting SIM sync from Vinaphone API...');

    try {
      const baseUrl = this.configService.get<string>('vinaphone.baseUrl')!;
      this.logger.debug(`Using base URL: ${baseUrl}`);
      const timeout =
        this.configService.get<number>('vinaphone.timeoutMs') ?? 10_000;
      const dataTimeout =
        this.configService.get<number>('vinaphone.dataTimeoutMs') ?? 120_000;
      const token = await this.getToken();
      const headers = this.authHeaders(token);

      // Fetch all SIMs via quickSearch (paginated)
      const allVinaSims = await this.fetchAllSimsQuickSearch(
        baseUrl,
        headers,
        dataTimeout,
      );
      if (allVinaSims.length === 0) {
        this.logger.warn('No SIMs returned from Vinaphone quickSearch API');
        return;
      }

      // Update local DB
      const now = new Date();
      const currentMonth = dayjs().format('YYYY-MM');
      let processed = 0;

      // Bulk-load all SIMs from DB into a map (phoneNumber → sim) to avoid N+1 queries
      const dbSims = await this.prisma.sim.findMany({
        select: {
          id: true,
          phoneNumber: true,
          status: true,
          imsi: true,
          contractCode: true,
        },
      });
      const simByPhone = new Map(dbSims.map((s) => [s.phoneNumber, s]));
      this.logger.log(
        `DB has ${dbSims.length} SIMs — will upsert from ${allVinaSims.length} Vinaphone SIMs`,
      );

      // Collect group IDs that need member sync (deduplicated)
      const groupsToSync = new Map<string, string>(); // groupId → groupName

      const BATCH_SIZE = 100;
      const upserts: Array<{
        phoneNumber: string;
        data: Record<string, unknown>;
        createExtra: Record<string, unknown>;
      }> = [];
      const usageUpserts: Array<{ phoneNumber: string; usedMB: number }> = [];

      for (const vSim of allVinaSims) {
        const {
          customerName,
          customerCode,
          contractInfo,
          simType,
          provinceCode,
          ratingPlanId,
          ratingPlanName,
        } = vSim;
        const msisdnStr = normalizeMsisdn(vSim.msisdn);
        const existing = simByPhone.get(msisdnStr);

        // usagedData is in bytes → convert to MB
        const newUsedMB = Math.round((vSim.usagedData ?? 0) / (1024 * 1024));
        const vinaphoneStatus = mapSimStatus(vSim.status);

        // Parse SOG (nhóm gói cước)
        const sog = parseSog(vSim.sog);
        const sogGroupId = sog?.id ?? null;
        const sogGroupName = sog?.ten_goi ?? null;
        const sogMaGoi = sog?.ma_goi ?? null;
        const sogIsOwner = sog ? sog.msisdn_chu_nhom === null : null;

        const sharedData: Record<string, unknown> = {
          usedMB: newUsedMB,
          syncedAt: now,
          systemStatus: vSim.connectionStatus ?? vinaphoneStatus,
          imsi: vSim.imsi ? String(vSim.imsi) : (existing?.imsi ?? null),
          contractCode: vSim.contractCode ?? existing?.contractCode ?? null,
          sogGroupId,
          sogGroupName,
          sogMaGoi,
          sogIsOwner,
          customerName,
          customerCode,
          contractInfo,
          simType,
          provinceCode,
          ratingPlanId,
          ratingPlanName,
        };

        // Auto-transition: Mới → Đã hoạt động when usedMB first > 0
        const currentStatus = existing?.status ?? 'Mới';
        if (currentStatus === 'Mới' && newUsedMB > 0) {
          sharedData['status'] = 'Đã hoạt động';
          sharedData['firstUsedAt'] = vSim.activatedDate
            ? new Date(vSim.activatedDate)
            : now;
          if (existing) {
            this.logger.log(`SIM ${msisdnStr} chuyển sang "Đã hoạt động"`);
          }
        }

        if (sogIsOwner && sogGroupId) {
          groupsToSync.set(sogGroupId, sogGroupName ?? '');
        }

        upserts.push({
          phoneNumber: msisdnStr,
          data: sharedData,
          // Fields required only on CREATE
          createExtra: {
            productCode:
              vSim.ratingPlanName ?? String(vSim.ratingPlanId ?? 'unknown'),
            createdAt: vSim.activatedDate ? new Date(vSim.activatedDate) : now,
          },
        });
        usageUpserts.push({ phoneNumber: msisdnStr, usedMB: newUsedMB });
        processed++;
      }

      // Execute upserts in batches
      for (let i = 0; i < upserts.length; i += BATCH_SIZE) {
        const batch = upserts.slice(i, i + BATCH_SIZE);
        await this.prisma.$transaction(
          batch.map(({ phoneNumber, data, createExtra }) =>
            this.prisma.sim.upsert({
              where: { phoneNumber },
              update: data,
              create: {
                phoneNumber,
                productCode: createExtra['productCode'] as string,
                createdAt: createExtra['createdAt'] as Date,
                ...data,
              },
            }),
          ),
        );
      }

      // Re-load id map for usage history (newly created SIMs need their UUIDs)
      const simIdMap = new Map(
        (
          await this.prisma.sim.findMany({
            select: { id: true, phoneNumber: true },
          })
        ).map((s) => [s.phoneNumber, s.id]),
      );

      // Upsert usage history in batches
      for (let i = 0; i < usageUpserts.length; i += BATCH_SIZE) {
        const batch = usageUpserts.slice(i, i + BATCH_SIZE);
        const batchWithIds = batch
          .map(({ phoneNumber, usedMB }) => ({
            simId: simIdMap.get(phoneNumber),
            usedMB,
          }))
          .filter((x): x is { simId: string; usedMB: number } => !!x.simId);
        await this.prisma.$transaction(
          batchWithIds.map(({ simId, usedMB }) =>
            this.prisma.usageHistory.upsert({
              where: { simId_month: { simId, month: currentMonth } },
              update: { usedMB },
              create: { simId, month: currentMonth, usedMB },
            }),
          ),
        );
      }

      // Sync group members for all unique chủ nhóm groups
      for (const [groupId, groupName] of groupsToSync) {
        await this.syncGroupMembers(
          baseUrl,
          headers,
          dataTimeout,
          groupId,
          groupName,
        );
      }

      await this.recalculateMasterSimUsage();
      this.logger.log(
        `Sync completed: ${processed}/${allVinaSims.length} SIMs processed.`,
      );
    } catch (err) {
      this.logger.error('Sync failed', (err as Error).stack);
    } finally {
      this.isSyncing = false;
    }
  }

  // ─── Sync rating plans ─────────────────────────────────────────────────────

  async syncRatingPlans() {
    this.logger.log('Starting rating plan sync from Vinaphone API...');
    try {
      const baseUrl = this.configService.get<string>('vinaphone.baseUrl')!;
      const timeout =
        this.configService.get<number>('vinaphone.timeoutMs') ?? 10_000;
      const token = await this.getToken();
      const headers = this.authHeaders(token);

      const allRatingPlans = await this.fetchAllRatingPlans(
        baseUrl,
        headers,
        timeout,
      );

      // Upsert rating plans
      for (const rp of allRatingPlans) {
        await this.prisma.ratingPlan.upsert({
          where: {
            ratingPlanId: rp.id,
          },
          update: { name: rp.name, code: rp.code, syncedAt: new Date() },
          create: {
            ratingPlanId: rp.id,
            code: rp.code,
            name: rp.name,
            syncedAt: new Date(),
          },
        });
      }

      this.logger.log(
        `Rating plan sync completed: ${allRatingPlans.length} plans processed.`,
      );
    } catch (err) {
      this.logger.error('Rating plan sync failed', (err as Error).stack);
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Paginate through sim-mgmt/quickSearch until all SIMs are fetched.
   */
  private async fetchAllSimsQuickSearch(
    baseUrl: string,
    headers: Record<string, string>,
    timeout: number,
  ): Promise<QuickSearchSimItem[]> {
    const pageSize = 10000;
    let page = 0;
    const allSims: QuickSearchSimItem[] = [];

    while (true) {
      const { data } = await firstValueFrom(
        this.httpService.get<VinaphoneApiBaseResponse<QuickSearchSimItem>>(
          `${baseUrl}/sim-mgmt/quickSearch`,
          {
            headers,
            timeout,
            params: {
              page,
              size: pageSize,
              sort: 'msisdn,asc',
              loggable: true,
              keySearch: '',
            },
          },
        ),
      );

      allSims.push(...data.content);

      if (data.last || allSims.length >= data.totalElements) {
        break;
      }
      page++;
    }

    this.logger.log(
      `quickSearch fetched ${allSims.length} SIMs across ${page + 1} pages`,
    );
    return allSims;
  }

  private async fetchAllRatingPlans(
    baseUrl: string,
    headers: Record<string, string>,
    timeout: number,
  ) {
    const pageSize = 1000;
    let page = 0;
    const allRatingPlans: RatingPlanItem[] = [];

    while (true) {
      const { data } = await firstValueFrom(
        this.httpService.get<VinaphoneApiBaseResponse<RatingPlanItem>>(
          `${baseUrl}/sim-mgmt/dropdown`,
          {
            headers,
            timeout,
            params: {
              page,
              size: pageSize,
              type: 'ratingPlan',
              sort: 'name,asc',
            },
          },
        ),
      );

      allRatingPlans.push(...data.content);

      if (data.last || allRatingPlans.length >= pageSize * (page + 1)) {
        break;
      }
      page++;
    }

    this.logger.log(`Fetched ${allRatingPlans.length} rating plans`);
    return allRatingPlans;
  }

  /**
   * Fetch all members of a group via /sim-mgmt/memberOfGr and upsert into sim_group_members.
   */
  private async syncGroupMembers(
    baseUrl: string,
    headers: Record<string, string>,
    timeout: number,
    groupId: string,
    ratingPlanName: string,
  ) {
    const pageSize = 500;
    let page = 0;

    while (true) {
      const { data } = await firstValueFrom(
        this.httpService.get<MemberOfGrResponse>(
          `${baseUrl}/sim-mgmt/memberOfGr`,
          {
            headers,
            timeout,
            params: { page, size: pageSize, id: groupId, ratingPlanName },
          },
        ),
      );

      const now = new Date();
      for (const member of data.content) {
        await this.prisma.simGroupMember.upsert({
          where: { groupId_msisdn: { groupId, msisdn: String(member.msisdn) } },
          update: {
            ratingPlanName: member.ratingPlanName,
            status: member.status,
            syncedAt: now,
          },
          create: {
            groupId,
            msisdn: String(member.msisdn),
            ratingPlanName: member.ratingPlanName,
            status: member.status,
            syncedAt: now,
          },
        });
      }

      if (data.last || data.content.length === 0) break;
      page++;
    }
  }

  private async recalculateMasterSimUsage() {
    const masterSims = await this.prisma.masterSim.findMany();

    for (const ms of masterSims) {
      const agg = await this.prisma.sim.aggregate({
        _sum: { usedMB: true },
        where: { masterSimCode: ms.code },
      });

      await this.prisma.masterSim.update({
        where: { id: ms.id },
        data: {
          usedMB: agg._sum.usedMB ?? 0,
          syncedAt: new Date(),
        },
      });
    }
  }
}
