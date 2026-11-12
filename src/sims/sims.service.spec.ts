import { SimsService } from './sims.service';
import type { PrismaService } from '../prisma/prisma.service';

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
