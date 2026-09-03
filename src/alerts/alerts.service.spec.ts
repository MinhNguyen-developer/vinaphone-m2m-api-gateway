import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: {
    alertConfig: {
      findMany: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      findUnique: jest.Mock;
    };
    sim: {
      findMany: jest.Mock;
    };
    alertCheck: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      alertConfig: {
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      sim: {
        findMany: jest.fn(),
      },
      alertCheck: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
    };

    service = new AlertsService(prisma as unknown as PrismaService);
  });

  it('creates a triggered record when a refreshed SIM meets an active threshold', async () => {
    prisma.alertConfig.findMany.mockResolvedValue([
      {
        id: 'alert-1',
        label: 'High usage',
        thresholdMB: 1000,
        status: 1,
        simId: null,
        groupId: null,
        productCode: null,
        ratingPlanId: null,
        simCodeLabel: null,
      },
    ]);
    prisma.sim.findMany.mockResolvedValue([
      {
        id: 'sim-1',
        phoneNumber: '0912345678',
        usedMB: 1200,
        productCode: 'PKG-1',
        ratingPlanId: 10,
        simCodeLabel: null,
        simGroups: [],
        simCode: null,
      },
    ]);
    prisma.alertCheck.findUnique.mockResolvedValue(null);
    prisma.alertCheck.create.mockResolvedValue({
      id: 'check-1',
      simId: 'sim-1',
      alertId: 'alert-1',
      checked: false,
      triggeredAt: new Date('2026-07-21T00:00:00.000Z'),
    });

    await expect(
      (service as any).syncTriggeredAlertsBySimIds(['sim-1']),
    ).resolves.toBe(1);

    expect(prisma.alertConfig.findMany).toHaveBeenCalledWith({
      where: { status: 1 },
    });
    expect(prisma.sim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { usedMB: { gte: 1000 } },
            { id: { in: ['sim-1'] } },
          ]),
        }),
      }),
    );
    expect(prisma.alertCheck.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        simId: 'sim-1',
        alertId: 'alert-1',
        checked: false,
        checkedAt: null,
        checkedBy: null,
      }),
    });
  });

  it('does not duplicate a triggered record on rerun', async () => {
    prisma.alertConfig.findMany.mockResolvedValue([
      {
        id: 'alert-1',
        label: 'High usage',
        thresholdMB: 1000,
        status: 1,
        simId: null,
        groupId: null,
        productCode: null,
        ratingPlanId: null,
        simCodeLabel: null,
      },
    ]);
    prisma.sim.findMany.mockResolvedValue([
      {
        id: 'sim-1',
        phoneNumber: '0912345678',
        usedMB: 1200,
        productCode: 'PKG-1',
        ratingPlanId: 10,
        simCodeLabel: null,
        simGroups: [],
        simCode: null,
      },
    ]);
    prisma.alertCheck.findUnique.mockResolvedValue({
      id: 'check-1',
      simId: 'sim-1',
      alertId: 'alert-1',
      checked: false,
      triggeredAt: new Date('2026-07-20T00:00:00.000Z'),
    });

    await expect(
      (service as any).syncTriggeredAlertsBySimIds(['sim-1']),
    ).resolves.toBe(0);

    expect(prisma.alertCheck.create).not.toHaveBeenCalled();
    expect(prisma.alertCheck.update).not.toHaveBeenCalled();
  });

  it('creates one triggered record for each matching active alert configuration', async () => {
    prisma.alertConfig.findMany.mockResolvedValue([
      {
        id: 'alert-group',
        label: 'Group usage',
        thresholdMB: 1000,
        status: 1,
        simId: null,
        groupId: 'group-1',
        productCode: null,
        ratingPlanId: null,
        simCodeLabel: null,
      },
      {
        id: 'alert-product',
        label: 'Product usage',
        thresholdMB: 1000,
        status: 1,
        simId: null,
        groupId: null,
        productCode: 'PKG-1',
        ratingPlanId: null,
        simCodeLabel: null,
      },
    ]);
    prisma.sim.findMany.mockResolvedValue([
      {
        id: 'sim-1',
        phoneNumber: '0912345678',
        usedMB: 1200,
        productCode: 'PKG-1',
        ratingPlanId: 10,
        simCodeLabel: 'SIM-001',
        simGroups: [
          {
            groupId: 'group-1',
            group: { id: 'group-1', name: 'Group 1' },
          },
        ],
        simCode: { id: 'sim-code-1', code: 'SIM-001' },
      },
    ]);
    prisma.alertCheck.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prisma.alertCheck.create.mockResolvedValue({
      id: 'check-1',
      simId: 'sim-1',
      alertId: 'alert-group',
      checked: false,
      triggeredAt: new Date('2026-07-21T00:00:00.000Z'),
    });

    await expect(
      (service as any).syncTriggeredAlertsBySimIds(['sim-1']),
    ).resolves.toBe(2);

    expect(prisma.alertCheck.create).toHaveBeenCalledTimes(2);
  });
});