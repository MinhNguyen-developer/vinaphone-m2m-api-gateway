import { of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SyncService', () => {
  let service: SyncService;
  let prisma: {
    sim: {
      findMany: jest.Mock;
      upsert: jest.Mock;
    };
    usageHistory: {
      upsert: jest.Mock;
    };
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

  beforeEach(() => {
    prisma = {
      sim: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      usageHistory: {
        upsert: jest.fn(),
      },
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

    service = new SyncService(
      prisma as unknown as PrismaService,
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
      alertsService as any,
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
    await service.syncSims();

    expect(alertsService.syncTriggeredAlertsBySimIds).toHaveBeenCalledWith([
      'sim-1',
    ]);
  });

  it('reuses the same synced SIM ids on repeated sync runs', async () => {
    await service.syncSims();
    await service.syncSims();

    expect(alertsService.syncTriggeredAlertsBySimIds).toHaveBeenCalledTimes(2);
    expect(alertsService.syncTriggeredAlertsBySimIds).toHaveBeenNthCalledWith(1, [
      'sim-1',
    ]);
    expect(alertsService.syncTriggeredAlertsBySimIds).toHaveBeenNthCalledWith(2, [
      'sim-1',
    ]);
  });
});