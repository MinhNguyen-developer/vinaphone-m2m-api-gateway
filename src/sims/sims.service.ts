import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { MonthlyDataUsage, Prisma, Sim } from '../generated/prisma/index.js';
import { SimStatus } from '../types/common';
import { PrismaService } from '../prisma/prisma.service';
import { QuerySimDto } from './dto/query-sim.dto';
import { parseSortParam } from './dto/query-sim.dto';
import {
  UpdateSimStatusDto,
  SimStatusAction,
  BatchUpdateSimStatusDto,
} from './dto/update-sim-status.dto';
import { UpdateFirstUsedAtDto } from './dto/update-first-used-at.dto';
import { QueryGroupMembersDto } from './dto/query-group-members.dto';
import mapSortStringToOrderInput from 'src/utils/mapSortStringToOrderInput';

@Injectable()
export class SimsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySimDto) {
    const {
      page = 1,
      pageSize = 50,
      productCode,
      masterSimCode,
      systemStatus,
      status,
      search,
      contractCode,
      imsi,
      ratingPlanId,
      groupName,
      groupId,
      simType,
      sort,
      sogIsOwner,
    } = query;

    const where: Prisma.SimWhereInput = {
      ...(productCode && { productCode }),
      ...(masterSimCode && { masterSimCode }),
      ...(ratingPlanId && { ratingPlanId }),
      ...(systemStatus && { systemStatus }),
      ...(groupName && { groupName }),
      ...(imsi && { imsi: { contains: imsi, mode: 'insensitive' } }),
      ...(contractCode && {
        contractCode: { contains: contractCode, mode: 'insensitive' },
      }),
      ...(groupId?.length && {
        simGroups: { some: { groupId: { in: groupId } } },
      }),
      ...(status && { status }),
      ...(simType !== undefined && { simType }),
      ...(sogIsOwner !== undefined && { sogIsOwner: Boolean(sogIsOwner) }), // 1 → true, 0 → false, undefined → ignore
      ...(search && {
        phoneNumber: { contains: search, mode: 'insensitive' },
      }),
    };

    const orderBy: Prisma.SimOrderByWithRelationInput[] =
      mapSortStringToOrderInput<Sim>(sort, [
        'contractCode',
        'phoneNumber',
        'groupName',
        'imsi',
        'ratingPlanName',
        'usedMB',
        'firstUsedAt',
        'sogIsOwner',
      ]);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sim.findMany({
        where,
        orderBy: orderBy.length ? orderBy : [{ phoneNumber: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          monthlyDataUsages: {
            select: {
              month: true,
              dataUsedMB: true,
            },
          },
          simGroups: {
            select: {
              group: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.sim.count({ where }),
    ]);

    // Collect all group-IDs and product-codes present in this page so we can
    // fetch alert configs that target groups or product codes (not just simId).
    const simIds = data.map((s) => s.id);
    const groupIds = [
      ...new Set(
        data.flatMap(
          (s) =>
            s.simGroups
              ?.map((sg: { group?: { id?: string } }) => sg.group?.id)
              .filter((id): id is string => !!id) ?? [],
        ),
      ),
    ];
    const productCodes = [
      ...new Set(
        data.map((s) => s.productCode).filter((c): c is string => !!c),
      ),
    ];

    const allMatchingAlerts = await this.prisma.alertConfig.findMany({
      where: {
        OR: [
          { simId: { in: simIds } },
          ...(groupIds.length ? [{ groupId: { in: groupIds } }] : []),
          ...(productCodes.length
            ? [{ productCode: { in: productCodes } }]
            : []),
          { simId: null, groupId: null, productCode: null }, // global alerts
        ],
      },
    });

    const simsWithAlerts = data.map((s) => {
      const simGroupIds =
        s.simGroups
          ?.map((sg: { group?: { id?: string } }) => sg.group?.id)
          .filter((id): id is string => !!id) ?? [];

      const alertConfigs = allMatchingAlerts.filter(
        (a) =>
          (!a.simId && !a.groupId && !a.productCode) || // global
          a.simId === s.id ||
          (a.groupId && simGroupIds.includes(a.groupId)) ||
          (a.productCode && a.productCode === s.productCode),
      );

      return { ...s, alertConfigs };
    });

    return {
      data: simsWithAlerts.map((s) => this.formatSim(s)),
      total,
      page,
      pageSize,
    };
  }

  async getAllSims() {
    const sims = await this.prisma.sim.findMany({
      select: {
        id: true,
        phoneNumber: true,
        ratingPlanName: true,
        productCode: true,
        status: true,
        usedMB: true,
        firstUsedAt: true,
      },
      orderBy: { phoneNumber: 'asc' },
    });
    return sims;
  }

  async findOne(id: string): Promise<Sim> {
    const sim = await this.prisma.sim.findUnique({ where: { id } });
    if (!sim) throw new NotFoundException(`SIM ${id} không tồn tại`);
    return sim;
  }

  async findAllSimsGroupByRatingPlan() {
    const sims = await this.prisma.sim.groupBy({
      by: ['ratingPlanId', 'ratingPlanName'],
      _count: {
        _all: true,
      },
      _sum: {
        usedMB: true,
      },
      orderBy: {
        ratingPlanName: 'asc',
      },
    });
    return sims;
  }

  async updateStatus(id: string, dto: UpdateSimStatusDto) {
    const sim = await this.findOne(id);

    if (dto.action === SimStatusAction.CONFIRM) {
      if (sim.status !== SimStatus.ACTIVE) {
        throw new BadRequestException(
          'Chỉ có thể xác nhận SIM đang ở trạng thái "Đã hoạt động"',
        );
      }
      return this.prisma.sim.update({
        where: { id },
        data: { status: SimStatus.CONFIRMED, confirmedAt: new Date() },
      });
    }

    return this.prisma.sim.update({
      where: { id },
      data: {
        status: SimStatus.NEW,
        usedMB: 0,
        firstUsedAt: null,
        confirmedAt: null,
      },
    });
  }

  async batchUpdateStatus(dto: BatchUpdateSimStatusDto) {
    const { ids, action } = dto;

    console.log('IDS RECEIVED FOR BATCH UPDATE:', ids, 'ACTION:', action);

    if (action === SimStatusAction.CONFIRM) {
      const simsToConfirm = await this.prisma.sim.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      console.log(
        'SIMs to confirm:',
        ids,
        simsToConfirm.map((s) => s.id),
      );

      if (simsToConfirm.length === 0) {
        throw new BadRequestException('Không có SIM để xác nhận');
      }

      return this.prisma.sim.updateMany({
        where: { id: { in: simsToConfirm.map((s) => s.id) } },
        data: { status: SimStatus.CONFIRMED, confirmedAt: new Date() },
      });
    }

    // Reset về trạng thái NEW
    return this.prisma.sim.updateMany({
      where: { id: { in: ids } },
      data: {
        status: SimStatus.NEW,
        usedMB: 0,
        firstUsedAt: null,
        confirmedAt: null,
      },
    });
  }

  async updateFirstUsedAt(id: string, dto: UpdateFirstUsedAtDto) {
    await this.findOne(id);
    return this.prisma.sim.update({
      where: { id },
      data: {
        firstUsedAt: dayjs(dto.firstUsedAt, 'YYYY-MM-DD HH:mm').toDate(),
      },
    });
  }

  async getGroupMembers(groupId: string, query: QueryGroupMembersDto) {
    const { page = 1, pageSize = 50, msisdn } = query;

    const where: Prisma.SimWhereInput = {
      sogGroupId: groupId,
      sogIsOwner: false,
      ...(msisdn && { phoneNumber: { contains: msisdn, mode: 'insensitive' } }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sim.findMany({
        where,
        orderBy: { phoneNumber: 'asc' },
        select: {
          phoneNumber: true,
          ratingPlanName: true,
          status: true,
          usedMB: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.sim.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  formatSim(
    sim: Sim & {
      monthlyDataUsages?: Pick<MonthlyDataUsage, 'month' | 'dataUsedMB'>[];
      simGroups?: unknown[];
      alertConfigs?: unknown[];
    },
  ) {
    return {
      id: sim.id,
      phoneNumber: sim.phoneNumber,
      imsi: sim.imsi,
      contractCode: sim.contractCode,
      productCode: sim.productCode,
      masterSimCode: sim.masterSimCode,
      systemStatus: sim.systemStatus,
      status: sim.status,
      usedMB: sim.usedMB,
      firstUsedAt: sim.firstUsedAt
        ? dayjs(sim.firstUsedAt).utcOffset('+07:00').format('YYYY-MM-DD HH:mm')
        : null,
      confirmedAt: sim.confirmedAt
        ? dayjs(sim.confirmedAt).utcOffset('+07:00').format('YYYY-MM-DD HH:mm')
        : null,
      createdAt: sim.createdAt,
      note: sim.note ?? '',
      sogGroupId: sim.sogGroupId,
      sogGroupName: sim.sogGroupName,
      sogMaGoi: sim.sogMaGoi,
      sogIsOwner: sim.sogIsOwner,
      simType: sim.simType,
      contractInfo: sim.contractInfo,
      customerName: sim.customerName,
      customerCode: sim.customerCode,
      provinceCode: sim.provinceCode,
      groupName: sim.groupName,
      monthlyDataUsages: sim.monthlyDataUsages ?? [],
      simGroups: sim.simGroups ?? [],
      alertConfigs: sim.alertConfigs ?? [],
    };
  }
}
