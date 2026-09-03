import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { SimStatus } from '../types/common';
import { AlertsService } from '../alerts/alerts.service';
import type {
  VinaphoneLoginResponse,
  QuickSearchSimItem,
  SogItem,
  MemberOfGrResponse,
  VinaphoneApiBaseResponse,
  RatingPlanItem,
  GroupSimItem,
  UsedDataItem,
  VinaphoneDetailPlanResponse,
  VinaphoneMonthlyDataUsageItem,
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

/** Map numeric status from Vinaphone to a display label */
function mapSimStatus(code: number): string {
  switch (code) {
    case 2:
      return 'Đang hoạt động';
    case 3:
      return 'Khoá 1 chiều';
    case 4:
      return 'Khoá 2 chiều';
    case 5:
      return 'Đã hủy';
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
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0; // Unix timestamp (seconds)
  private isSyncing = false; // guard against overlapping runs

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly alertsService: AlertsService,
  ) {}

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

  /**
   * Retry an async operation up to `maxAttempts` times with exponential backoff.
   * Only retries on network errors or HTTP 5xx responses.
   */
  private async withRetry<T>(
    label: string,
    fn: () => Promise<T>,
    maxAttempts = 3,
    baseDelayMs = 2_000,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const status = err?.response?.status as number | undefined;
        const isRetryable =
          !status || // network error (no response)
          status === 429 || // rate limited
          (status >= 500 && status <= 599); // server error

        if (!isRetryable || attempt === maxAttempts) throw err;

        const delay = baseDelayMs * 2 ** (attempt - 1); // 2s, 4s, 8s …
        this.logger.warn(
          `${label} — attempt ${attempt}/${maxAttempts} failed (status ${status ?? 'network'}), retrying in ${delay}ms`,
        );
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new Error(`${label} — exhausted ${maxAttempts} attempts`);
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

      // ── Bulk-fetch usage data (one call per 200 SIMs instead of 1 per SIM) ──
      const USAGE_BATCH_SIZE = 200;
      const usedDataMap = new Map<number, number>(); // msisdn → usedMB
      for (let i = 0; i < allVinaSims.length; i += USAGE_BATCH_SIZE) {
        const chunk = allVinaSims.slice(i, i + USAGE_BATCH_SIZE);
        const msisdns = chunk.map((s) => s.msisdn);
        const batchNum = Math.floor(i / USAGE_BATCH_SIZE) + 1;
        try {
          const { data: items } = await this.withRetry(
            `get-data-used batch ${batchNum}`,
            () =>
              firstValueFrom(
                this.httpService.post<UsedDataItem[]>(
                  `${baseUrl}/sim-mgmt/get-data-used`,
                  msisdns,
                  { headers, timeout: dataTimeout },
                ),
              ),
          );
          for (const item of items) {
            const mb = Math.round(Number(item.usedData ?? 0) / (1024 * 1024));
            usedDataMap.set(Number(item.msisdn), mb);
          }
          this.logger.debug(
            `get-data-used batch ${batchNum}: fetched ${items.length} records`,
          );
        } catch (err) {
          this.logger.warn(
            `get-data-used batch ${batchNum} failed after retries — usage data will be 0 for this batch`,
            err,
          );
        }
      }
      this.logger.log(
        `Fetched usage data for ${usedDataMap.size} SIMs in ${Math.ceil(allVinaSims.length / USAGE_BATCH_SIZE)} batch(es)`,
      );

      for (const vSim of allVinaSims) {
        const {
          customerName,
          customerCode,
          contractInfo,
          simType,
          provinceCode,
          ratingPlanId,
          ratingPlanName,
          groupName,
          contractDate,
        } = vSim;
        const msisdnStr = String(vSim.msisdn);
        const existing = simByPhone.get(msisdnStr);

        const newUsedMB = usedDataMap.get(Number(vSim.msisdn)) ?? 0;

        // Parse SOG (nhóm gói cước)
        // quickSearch sometimes returns sog=null — fall back to detail endpoint
        const sog =
          vSim.sog !== null
            ? parseSog(vSim.sog)
            : await this.fetchSimSog(
                baseUrl,
                headers,
                timeout,
                String(vSim.msisdn),
              );
        const sogGroupId = sog?.id ?? null;
        const sogGroupName = sog?.ten_goi ?? null;
        const sogMaGoi = sog?.ma_goi ?? null;
        const sogIsOwner = sog ? sog.msisdn_chu_nhom === null : null;
        const sogMaster = sog ? sog.msisdn_chu_nhom?.toString() : null;

        const sharedData: Record<string, unknown> = {
          usedMB: newUsedMB,
          syncedAt: now,
          systemStatus: mapSimStatus(vSim.status),
          vinaphoneStatus: vSim.status,
          imsi: vSim.imsi ? String(vSim.imsi) : (existing?.imsi ?? null),
          contractCode: vSim.contractCode ?? existing?.contractCode ?? null,
          sogGroupId,
          sogGroupName,
          sogMaGoi,
          sogIsOwner,
          sogMaster,
          customerName,
          customerCode,
          contractInfo,
          simType,
          provinceCode,
          ratingPlanId,
          ratingPlanName,
          groupName, // newly added field from quickSearch response (not in original sims-mgmt API)
          contractDate,
          vinaphoneActivatedAt: vSim.activatedDate
            ? new Date(vSim.activatedDate)
            : null,
        };

        // Auto-transition: NEW → ACTIVE when usedMB first > 0
        const currentStatus = existing?.status ?? SimStatus.NEW;
        if (currentStatus === SimStatus.NEW && newUsedMB > 0) {
          sharedData['status'] = SimStatus.ACTIVE;
          sharedData['firstUsedAt'] = now;
          if (existing) {
            this.logger.log(`SIM ${msisdnStr} chuyển sang ACTIVE (2)`);
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
            contractDate: vSim.contractDate
              ? new Date(vSim.contractDate)
              : null,
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
                status:
                  (createExtra['status'] as number | undefined) ??
                  SimStatus.NEW,
                createdAt: createExtra['createdAt'] as Date,
                contractDate: createExtra['contractDate'] as Date | null,
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

      const syncedSimIds = upserts
        .map(({ phoneNumber }) => simIdMap.get(phoneNumber))
        .filter((simId): simId is string => !!simId);

      const createdAlertChecks =
        await this.alertsService.syncTriggeredAlertsBySimIds(syncedSimIds);
      this.logger.log(
        `Alert trigger sync completed: ${createdAlertChecks} trigger record(s) created.`,
      );

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

  // ─── Sync monthly usage (user-triggered) ───────────────────────────────────

  /**
   * Fetch detail-plan for all SIMs and upsert MonthlyDataUsage.
   * This is meant to be triggered manually by the user (not via cron)
   * because the Vinaphone API has rate limits (~5000 calls/day).
   */
  async syncMonthlyUsage(): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    this.logger.log('Starting monthly usage sync (detail-plan)...');
    const dataTimeout =
      this.configService.get<number>('vinaphone.dataTimeoutMs') ?? 120_000;
    const currentMonth = dayjs().format('YYYY-MM');

    // Get master SIM phone numbers
    const masterSims = await this.prisma.sim.findMany({
      select: { phoneNumber: true },
      where: { sogIsOwner: true },
    });

    const normalSims = await this.prisma.sim.findMany({
      select: { phoneNumber: true },
      where: { OR: [{ sogIsOwner: false }, { sogIsOwner: null }] },
    });

    const normalMsisdns = normalSims.map((s) => Number(s.phoneNumber));
    const masterMsisdns = masterSims.map((s) => Number(s.phoneNumber));

    this.logger.log(
      `Monthly usage sync: ${normalMsisdns.length} normal SIMs, ${masterMsisdns.length} master SIMs`,
    );

    // Fetch detail-plan for normal SIMs
    const detailPlanMap = await this.fetchAllDetailPlans(
      normalMsisdns,
      dataTimeout,
    );
    this.logger.log(
      `Fetched detail-plan for ${detailPlanMap.size}/${normalMsisdns.length} normal SIMs`,
    );

    // Fetch searchSanLuongThueBao for master SIMs
    const masterUsageMap = await this.fetchMasterSimUsage(
      masterMsisdns,
      dataTimeout,
    );
    this.logger.log(
      `Fetched searchSanLuongThueBao for ${masterUsageMap.size}/${masterMsisdns.length} master SIMs`,
    );

    // Merge both results
    const allEntries = new Map<
      string,
      { dataUsedMB: number; totalData: number | null }
    >();
    for (const [msisdn, data] of detailPlanMap) {
      allEntries.set(msisdn, data);
    }
    for (const [msisdn, data] of masterUsageMap) {
      allEntries.set(msisdn, data);
    }

    // Upsert MonthlyDataUsage in batches
    const monthlyEntries = Array.from(allEntries.entries());
    for (let i = 0; i < monthlyEntries.length; i += 50) {
      const batch = monthlyEntries.slice(i, i + 50);
      await this.prisma.$transaction(
        batch.map(([msisdn, { dataUsedMB, totalData }]) =>
          this.prisma.monthlyDataUsage.upsert({
            where: { msisdn_month: { msisdn, month: currentMonth } },
            update: { dataUsedMB, totalData },
            create: { msisdn, month: currentMonth, dataUsedMB, totalData },
          }),
        ),
      );
    }
    this.logger.log(
      `Upserted MonthlyDataUsage for ${monthlyEntries.length} SIMs`,
    );

    return {
      success: allEntries.size,
      failed: normalMsisdns.length + masterMsisdns.length - allEntries.size,
      total: normalMsisdns.length + masterMsisdns.length,
    };
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

  // --- Sync group sims ─────────────────────────────────────────────────────

  async syncGroupSims() {
    this.logger.log('Starting group sim sync from Vinaphone API...');
    try {
      const baseUrl = this.configService.get<string>('vinaphone.baseUrl')!;
      const timeout =
        this.configService.get<number>('vinaphone.timeoutMs') ?? 10_000;
      const token = await this.getToken();
      const headers = this.authHeaders(token);

      const allGroupSims = await this.fetchAllGroupSims(
        baseUrl,
        headers,
        timeout,
      );

      // Upsert group sims
      for (const gs of allGroupSims) {
        await this.prisma.groupSim.upsert({
          where: {
            groupId: gs.id,
          },
          update: { name: gs.name, groupKey: gs.groupKey },
          create: {
            groupId: gs.id,
            name: gs.name,
            groupKey: gs.groupKey,
          },
        });
      }

      this.logger.log(
        `Group sim sync completed: ${allGroupSims.length} group sims processed.`,
      );
    } catch (err) {
      this.logger.error('Group sim sync failed', (err as Error).stack);
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
      const { data } = await this.withRetry(`quickSearch page ${page}`, () =>
        firstValueFrom(
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
      const { data } = await this.withRetry(
        `ratingPlan dropdown page ${page}`,
        () =>
          firstValueFrom(
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

  private async fetchAllGroupSims(
    baseUrl: string,
    headers: Record<string, string>,
    timeout: number,
  ) {
    const pageSize = 20;
    let page = 0;
    const allGroupSims: GroupSimItem[] = [];

    while (true) {
      const { data } = await this.withRetry(
        `groupSim dropdown page ${page}`,
        () =>
          firstValueFrom(
            this.httpService.get<VinaphoneApiBaseResponse<GroupSimItem>>(
              `${baseUrl}/sim-mgmt/dropdown`,
              {
                headers,
                timeout,
                params: {
                  page,
                  size: pageSize,
                  type: 'groupSim',
                  sort: 'name,asc',
                },
              },
            ),
          ),
      );

      allGroupSims.push(...data.content);

      if (data.last || allGroupSims.length >= pageSize * (page + 1)) {
        break;
      }
      page++;
    }

    this.logger.log(`Fetched ${allGroupSims.length} group sims`);
    return allGroupSims;
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
      const { data } = await this.withRetry(
        `memberOfGr group ${groupId} page ${page}`,
        () =>
          firstValueFrom(
            this.httpService.get<MemberOfGrResponse>(
              `${baseUrl}/sim-mgmt/memberOfGr`,
              {
                headers,
                timeout,
                params: { page, size: pageSize, id: groupId, ratingPlanName },
              },
            ),
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

  /**
   * Fetch the sog field for a single SIM via GET /sim-mgmt/<msisdn>.
   * Used as a fallback when quickSearch returns sog=null.
   */
  private async fetchSimSog(
    baseUrl: string,
    headers: Record<string, string>,
    timeout: number,
    msisdn: string,
  ): Promise<SogItem | null> {
    try {
      const { data } = await this.withRetry(`fetchSimDetail ${msisdn}`, () =>
        firstValueFrom(
          this.httpService.get<Pick<QuickSearchSimItem, 'sog'>>(
            `${baseUrl}/sim-mgmt/${msisdn}`,
            { headers, timeout },
          ),
        ),
      );
      return parseSog(data.sog);
    } catch (err) {
      this.logger.warn(
        `fetchSimDetail ${msisdn} failed — sog will be null`,
        err,
      );
      return null;
    }
  }

  /**
   * Fetch detail-plan for a single SIM to get dataUseInMonth.
   * Returns null on failure (graceful degradation).
   */
  private async fetchSimDetailPlan(
    msisdn: string,
    timeout: number,
  ): Promise<VinaphoneDetailPlanResponse | null> {
    const baseUrl = this.configService.get<string>('vinaphone.baseUrl')!;
    const token = await this.getToken();
    const headers = this.authHeaders(token);
    try {
      const { data } = await this.withRetry(
        `detail-plan ${msisdn}`,
        () =>
          firstValueFrom(
            this.httpService.get<VinaphoneDetailPlanResponse>(
              `${baseUrl}/sim-mgmt/detail-plan/${msisdn}`,
              { headers, timeout },
            ),
          ),
        2,
      );
      return data;
    } catch {
      this.logger.warn(`detail-plan ${msisdn} failed — skipping`);
      return null;
    }
  }

  /**
   * Fetch detail-plan for all SIMs concurrently with controlled parallelism.
   * Uses Promise.allSettled so individual failures don't crash the batch.
   * Includes 5s delay between batches and circuit breaker (10 consecutive failures).
   */
  private async fetchAllDetailPlans(
    msisdns: number[],
    timeout: number,
    concurrency = 10,
  ): Promise<Map<string, { dataUsedMB: number; totalData: number | null }>> {
    const results = new Map<
      string,
      { dataUsedMB: number; totalData: number | null }
    >();
    const total = msisdns.length;
    let successCount = 0;
    let failCount = 0;
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 10;
    const BATCH_DELAY_MS = 5_000;

    for (let i = 0; i < msisdns.length; i += concurrency) {
      // Circuit breaker: stop if too many consecutive failures
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        this.logger.error(
          `detail-plan circuit breaker triggered: ${MAX_CONSECUTIVE_FAILURES} consecutive failures. ` +
            `Stopping early at ${i}/${total}. Success so far: ${successCount}`,
        );
        break;
      }

      const batch = msisdns.slice(i, i + concurrency);
      const settled = await Promise.allSettled(
        batch.map((msisdn) => this.fetchSimDetailPlan(String(msisdn), timeout)),
      );

      let batchHasSuccess = false;
      for (let j = 0; j < batch.length; j++) {
        const result = settled[j];
        if (result.status === 'fulfilled' && result.value) {
          const bytes = result.value.dataUseInMonth ?? 0;
          results.set(String(batch[j]), {
            dataUsedMB: Math.round(bytes / (1024 * 1024)),
            totalData: result.value.limitDataUsage ?? null,
          });
          successCount++;
          batchHasSuccess = true;
        } else {
          failCount++;
        }
      }

      // Track consecutive failures at batch level
      if (batchHasSuccess) {
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
      }

      const processed = Math.min(i + concurrency, total);
      if (processed % 50 === 0 || processed === total) {
        this.logger.log(
          `detail-plan progress: ${processed}/${total} (success: ${successCount}, failed: ${failCount})`,
        );
      }

      // Delay between batches to avoid rate limiting
      if (i + concurrency < msisdns.length) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    if (failCount > 0) {
      this.logger.warn(
        `detail-plan completed with ${failCount} failures out of ${total} SIMs`,
      );
    }

    return results;
  }

  /**
   * Fetch usage data for master SIMs via POST /sim-mgmt/searchSanLuongThueBao.
   * This API accepts an array of msisdns (in 84xxx format) and returns usage in MB.
   * Batches requests to avoid overloading the API.
   */
  private async fetchMasterSimUsage(
    msisdns: number[],
    timeout: number,
    batchSize = 50,
  ): Promise<Map<string, { dataUsedMB: number; totalData: number | null }>> {
    const results = new Map<
      string,
      { dataUsedMB: number; totalData: number | null }
    >();
    if (msisdns.length === 0) return results;

    const baseUrl = this.configService.get<string>('vinaphone.baseUrl')!;
    const token = await this.getToken();
    const headers = this.authHeaders(token);

    // Convert local format (0xxx) to API format (84xxx)
    const toApiFormat = (msisdn: number): number => {
      const str = String(msisdn);
      if (str.startsWith('0')) {
        return Number('84' + str.slice(1));
      }
      return msisdn;
    };

    // Build reverse map: apiMsisdn → original DB phone number
    const reverseMap = new Map<number, string>();
    for (const msisdn of msisdns) {
      reverseMap.set(toApiFormat(msisdn), String(msisdn));
    }

    for (let i = 0; i < msisdns.length; i += batchSize) {
      const batch = msisdns.slice(i, i + batchSize);
      const apiMsisdns = batch.map(toApiFormat);

      try {
        const { data: items } = await this.withRetry(
          `searchSanLuongThueBao batch ${Math.floor(i / batchSize) + 1}`,
          () =>
            firstValueFrom(
              this.httpService.post<VinaphoneMonthlyDataUsageItem[]>(
                `${baseUrl}/sim-mgmt/searchSanLuongThueBao`,
                apiMsisdns,
                { headers, timeout },
              ),
            ),
        );

        for (const item of items) {
          // Map API msisdn back to the original DB phone number
          const dbPhone =
            reverseMap.get(Number(item.msisdn)) ?? String(item.msisdn);
          results.set(dbPhone, {
            dataUsedMB: item.dataUsed ?? 0,
            totalData: item.totalData ?? null,
          });
        }

        this.logger.debug(
          `searchSanLuongThueBao batch ${Math.floor(i / batchSize) + 1}: fetched ${items.length} records`,
        );
      } catch (err) {
        this.logger.warn(
          `searchSanLuongThueBao batch ${Math.floor(i / batchSize) + 1} failed`,
          err,
        );
      }

      // Delay between batches
      if (i + batchSize < msisdns.length) {
        await new Promise((r) => setTimeout(r, 5_000));
      }
    }

    return results;
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
