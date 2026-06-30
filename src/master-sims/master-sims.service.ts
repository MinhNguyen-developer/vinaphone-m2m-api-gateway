import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginatedResult } from '../../src/types/common';
import { Prisma, Sim } from '../../src/generated/prisma';
import { QueryMasterSimDto } from './dto/query-master-sim.dto';
import mapSortStringToOrderInput from 'src/utils/mapSortStringToOrderInput';

@Injectable()
export class MasterSimsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: QueryMasterSimDto): Promise<PaginatedResult<Sim>> {
    const {
      page = 1,
      pageSize = 50,
      search,
      msisdn,
      imsi,
      contractCode,
      ratingPlanId,
      sort,
      groupId,
    } = params;

    const where: Prisma.SimWhereInput = {
      sogIsOwner: true,
      ...(ratingPlanId && { ratingPlanId }),
      ...(msisdn && { phoneNumber: { contains: msisdn, mode: 'insensitive' } }),
      ...(imsi && { imsi: { contains: imsi, mode: 'insensitive' } }),
      ...(contractCode && {
        contractCode: { contains: contractCode, mode: 'insensitive' },
      }),
      ...(groupId && { simGroups: { some: { groupId } } }),
      ...(search && {
        OR: [
          { phoneNumber: { contains: search, mode: 'insensitive' } },
          { imsi: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy = mapSortStringToOrderInput<Sim>(sort, [
      'phoneNumber',
      'imsi',
      'ratingPlanName',
      'usedMB',
      'contractCode',
    ]);

    const sortSegment = sort?.split(':');
    const sortDir =
      sortSegment?.[1] === 'asc' || sortSegment?.[1] === 'desc'
        ? (sortSegment[1] as 'asc' | 'desc')
        : null;
    const effectiveOrderBy: Prisma.SimOrderByWithRelationInput[] = (() => {
      if (sortDir && sortSegment?.[0] === 'simGroups') {
        return [{ simGroups: { _count: sortDir } }];
      }
      return orderBy.length ? orderBy : [{ phoneNumber: 'asc' }];
    })();

    const [masterSims, total] = await this.prisma.$transaction([
      this.prisma.sim.findMany({
        where,
        orderBy: effectiveOrderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          monthlyDataUsages: true,
          simGroups: { include: { group: true } },
        },
      }),
      this.prisma.sim.count({ where }),
    ]);
    return {
      data: masterSims,
      page,
      pageSize,
      total,
    };
  }

  async findMembers(code: string, query: Record<string, unknown> = {}) {
    const masterSim = await this.prisma.masterSim.findUnique({
      where: { code },
    });
    if (!masterSim)
      throw new NotFoundException(`SIM chủ ${code} không tồn tại`);

    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 50);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sim.findMany({
        where: { masterSimCode: code },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.sim.count({ where: { masterSimCode: code } }),
    ]);

    return { data, total, page, pageSize };
  }
}
