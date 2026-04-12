import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import { Prisma, Sim } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { QuerySimDto } from './dto/query-sim.dto';
import { UpdateSimStatusDto, SimStatusAction } from './dto/update-sim-status.dto';
import { UpdateFirstUsedAtDto } from './dto/update-first-used-at.dto';

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
    } = query;

    const where: Prisma.SimWhereInput = {
      ...(productCode && { productCode }),
      ...(masterSimCode && { masterSimCode }),
      ...(systemStatus && { systemStatus }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { phoneNumber: { contains: search, mode: 'insensitive' } },
          { imsi: { contains: search, mode: 'insensitive' } },
          { contractCode: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sim.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.sim.count({ where }),
    ]);

    return { data: data.map((s) => this.formatSim(s)), total, page, pageSize };
  }

  async findOne(id: string): Promise<Sim> {
    const sim = await this.prisma.sim.findUnique({ where: { id } });
    if (!sim) throw new NotFoundException(`SIM ${id} không tồn tại`);
    return sim;
  }

  async updateStatus(id: string, dto: UpdateSimStatusDto) {
    const sim = await this.findOne(id);

    if (dto.action === SimStatusAction.CONFIRM) {
      if (sim.status !== 'Đã hoạt động') {
        throw new BadRequestException(
          'Chỉ có thể xác nhận SIM đang ở trạng thái "Đã hoạt động"',
        );
      }
      return this.prisma.sim.update({
        where: { id },
        data: { status: 'Đã xác nhận', confirmedAt: new Date() },
      });
    }

    return this.prisma.sim.update({
      where: { id },
      data: { status: 'Mới', usedMB: 0, firstUsedAt: null, confirmedAt: null },
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

  formatSim(sim: Sim) {
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
    };
  }
}
