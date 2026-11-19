import { SimsService } from './sims.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma';

describe('SimsService pagination', () => {
  const prisma = {
    sim: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    alertConfig: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new SimsService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockResolvedValue([[], 1315]);
    prisma.alertConfig.findMany.mockResolvedValue([]);
  });

  it.each([
    ['status:asc', [{ status: 'asc' }, { id: 'asc' }]],
    ['status:desc', [{ status: 'desc' }, { id: 'asc' }]],
    [
      'status:asc,usedMB:desc',
      [{ status: 'asc' }, { usedMB: 'desc' }, { id: 'asc' }],
    ],
    ['simGroups:asc', [{ simGroups: { _count: 'asc' } }, { id: 'asc' }]],
    ['simGroups:desc', [{ simGroups: { _count: 'desc' } }, { id: 'asc' }]],
    [undefined, [{ phoneNumber: 'asc' }, { id: 'asc' }]],
    ['unknown:asc', [{ phoneNumber: 'asc' }, { id: 'asc' }]],
  ])(
    'uses a unique tie-breaker for %s on every page without changing filters',
    async (sort, orderBy) => {
      const groupId = '420c4629-fe04-4730-b09a-0758085d3e39';

      for (const page of [1, 2, 3]) {
        await expect(
          service.findAll({ page, pageSize: 100, sort, groupId: [groupId] }),
        ).resolves.toMatchObject({ page, pageSize: 100, total: 1315 });

        expect(prisma.sim.findMany).toHaveBeenLastCalledWith(
          expect.objectContaining({
            orderBy,
            skip: (page - 1) * 100,
            take: 100,
            where: { simGroups: { some: { groupId: { in: [groupId] } } } },
          }),
        );
      }
    },
  );
});

describe('SimsService picker and code filters', () => {
  const prisma = {
    sim: { findMany: jest.fn(), count: jest.fn() },
    alertConfig: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new SimsService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockResolvedValue([[], 501]);
    prisma.sim.findMany.mockResolvedValue([]);
    prisma.alertConfig.findMany.mockResolvedValue([]);
  });

  it('bounds picker responses with stable page boundaries and a total', async () => {
    await expect(
      service.getAllSims({ page: 2, pageSize: 500 }),
    ).resolves.toEqual({
      data: [],
      total: 501,
      page: 2,
      pageSize: 500,
    });
    expect(prisma.sim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 500,
        take: 500,
        orderBy: [{ phoneNumber: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('preserves the array response when pagination is omitted', async () => {
    await expect(service.getAllSims()).resolves.toEqual([]);
  });

  it('loads all legacy picker SIMs in bounded queries without losing group data', async () => {
    const sims = Array.from({ length: 40_000 }, (_, i) => ({
      id: `sim-${i}`,
      phoneNumber: String(84900000000 + i),
      internalImsi: String(1000000000 + i),
      simGroups: [{ group: { id: 'group-1', name: 'Test group' } }],
    }));
    // Prisma 7.7 reproduces P2029 when an unbounded nested read loads 40k SIMs.
    prisma.sim.findMany.mockImplementation(
      ({ skip = 0, take }: Prisma.SimFindManyArgs) => {
        if (take === undefined || take > 1000) {
          throw new Error('P2029: unbounded SIM relation query');
        }
        return Promise.resolve(sims.slice(skip, skip + take));
      },
    );

    const result = await service.getAllSims();

    if (!Array.isArray(result)) throw new Error('Expected legacy array response');
    expect(result).toHaveLength(40_000);
    expect(result[0]).toEqual({
      id: 'sim-0',
      phoneNumber: '84900000000',
      internalImsi: '1000000000',
      simGroups: [{ group: { id: 'group-1', name: 'Test group' } }],
    });
    expect(result[39_999]).toMatchObject({
      id: 'sim-39999',
      internalImsi: '1000039999',
      simGroups: [{ group: { id: 'group-1', name: 'Test group' } }],
    });
    expect(new Set(result.map((sim) => sim.id)).size).toBe(40_000);
  });

  it('matches any selected SIM code while retaining other filters for rows and count', async () => {
    await service.findAll({
      simCode: ['code-1', 'code-2'],
      status: 2,
      groupId: ['group-1'],
    });
    const where = {
      simCode: { id: { in: ['code-1', 'code-2'] } },
      status: 2,
      simGroups: { some: { groupId: { in: ['group-1'] } } },
    };
    expect(prisma.sim.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where }),
    );
    expect(prisma.sim.count).toHaveBeenCalledWith({ where });
  });

  it('clearing all code selections removes the code constraint', async () => {
    await service.findAll({ simCode: [] });
    expect(prisma.sim.count).toHaveBeenCalledWith({ where: {} });
  });
});
