import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SyncService', () => {
  const accountId = '0f6462cc-2e64-4f50-931b-4e379023ad14';
  let service: SyncService;
  let prisma: {
    sim: {
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
    usageHistory: {
      upsert: jest.Mock;
    };
    syncJobState: {
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
    ratingPlan: { count: jest.Mock };
    $transaction: jest.Mock;
  };
  let httpService: {
    post: jest.Mock;
  };
  let configService: {
    get: jest.Mock;
  };
  let alertsService: {
    syncTriggeredAlertsBySimIds: jest.Mock;
  };
  let authService: {
    getValidVinaphoneToken: jest.Mock;
    getEligibleAccountIds: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      sim: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      usageHistory: {
        upsert: jest.fn(),
      },
      syncJobState: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({}),
      },
      ratingPlan: { count: jest.fn().mockResolvedValue(1) },
      $transaction: jest.fn(async (operations: Array<Promise<unknown>>) =>
        Promise.all(operations),
      ),
    };

    httpService = {
      post: jest.fn().mockReturnValue(
        of({
          data: [
            {
              msisdn: '0912345678',
              usedData: String(1200 * 1024 * 1024),
            },
          ],
        }),
      ),
    };

    configService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'vinaphone.baseUrl':
            return 'https://vinaphone.example';
          case 'vinaphone.timeoutMs':
            return 10_000;
          case 'vinaphone.dataTimeoutMs':
            return 120_000;
          default:
            return undefined;
        }
      }),
    };

    alertsService = {
      syncTriggeredAlertsBySimIds: jest.fn().mockResolvedValue(1),
    };
    authService = {
      getValidVinaphoneToken: jest.fn().mockResolvedValue('token'),
      getEligibleAccountIds: jest.fn().mockResolvedValue([accountId]),
    };

    service = new SyncService(
      prisma as unknown as PrismaService,
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
      alertsService as any,
      authService as any,
    );

    jest.spyOn(service as any, 'getToken').mockResolvedValue('token');
    jest.spyOn(service as any, 'withRetry').mockImplementation(
      async (_label: string, fn: () => Promise<unknown>) => fn(),
    );
    jest.spyOn(service as any, 'fetchAllSimsQuickSearch').mockResolvedValue([
      {
        msisdn: '0912345678',
        customerName: 'Test Customer',
        customerCode: 'C001',
        contractInfo: 'Contract info',
        simType: 0,
        provinceCode: '01',
        ratingPlanId: 10,
        ratingPlanName: 'Plan A',
        groupName: 'Group A',
        contractDate: null,
        activatedDate: null,
        status: 1,
      },
    ]);
    jest.spyOn(service as any, 'syncGroupMembers').mockResolvedValue(undefined);
    jest.spyOn(service as any, 'recalculateMasterSimUsage').mockResolvedValue(
      undefined,
    );

    prisma.sim.findMany.mockResolvedValue([
      {
        id: 'sim-1',
        phoneNumber: '0912345678',
        status: 1,
        imsi: null,
        contractCode: null,
      },
    ]);
    prisma.sim.upsert.mockResolvedValue({ id: 'sim-1' });
    prisma.usageHistory.upsert.mockResolvedValue({ id: 'usage-1' });
  });

  it('invokes alert trigger synchronization after SIM and usage upserts', async () => {
    await service.syncSims(accountId);

    expect(alertsService.syncTriggeredAlertsBySimIds).toHaveBeenCalledWith([
      'sim-1',
    ]);
  });

  it('reuses the same synced SIM ids on repeated sync runs', async () => {
    await service.syncSims(accountId);
    await service.syncSims(accountId);

    expect(alertsService.syncTriggeredAlertsBySimIds).toHaveBeenCalledTimes(2);
    expect(alertsService.syncTriggeredAlertsBySimIds).toHaveBeenNthCalledWith(1, [
      'sim-1',
    ]);
    expect(alertsService.syncTriggeredAlertsBySimIds).toHaveBeenNthCalledWith(2, [
      'sim-1',
    ]);
  });

  it('keeps progress and persisted last-sync state isolated by account', async () => {
    const secondAccountId = '1f6462cc-2e64-4f50-931b-4e379023ad14';

    await service.syncSims(accountId);

    const accountStatus = await service.getSyncStatus(accountId);
    const otherAccountStatus = await service.getSyncStatus(secondAccountId);

    expect(accountStatus.syncSims.state).toBe('completed');
    expect(accountStatus.syncSims.lastSyncedAt).toBeTruthy();
    expect(otherAccountStatus.syncSims.state).toBe('idle');
    expect(otherAccountStatus.syncSims.lastSyncedAt).toBeUndefined();
    expect(prisma.syncJobState.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId_job: { accountId, job: 'syncSims' } },
        create: expect.objectContaining({ accountId }),
      }),
    );
  });

  it('syncs rating plans before a manual SIM sync when the account has none', async () => {
    const operations: string[] = [];
    prisma.ratingPlan.count.mockResolvedValue(0);
    jest
      .spyOn(service as any, 'syncRatingPlansInTenant')
      .mockImplementation(async () => {
        operations.push('rating-plans');
        return true;
      });
    jest
      .spyOn(service as any, 'syncSimsInTenant')
      .mockImplementation(async () => {
        operations.push('sims');
      });

    await service.syncSims(accountId);

    expect(prisma.ratingPlan.count).toHaveBeenCalled();
    expect(operations).toEqual(['rating-plans', 'sims']);
  });

  it('runs cron sync in dependency order', async () => {
    const operations: string[] = [];
    jest.spyOn(service, 'syncRatingPlans').mockImplementation(async () => {
      operations.push('rating-plans');
      return true;
    });
    jest.spyOn(service, 'syncSims').mockImplementation(async () => {
      operations.push('sims');
    });
    jest.spyOn(service, 'syncGroupSims').mockImplementation(async () => {
      operations.push('groups');
    });

    await service.syncEligibleAccounts();

    expect(operations).toEqual(['rating-plans', 'sims', 'groups']);
  });
});
