import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma';
import { CreateSimCodeDto } from './dto/create-sim-code.dto';
import { UpdateSimCodeDto } from './dto/update-sim-code.dto';
import { QuerySimCodeDto } from './dto/query-sim-code.dto';
import { QuerySimCodeSimsDto } from './dto/query-simcode-sims.dto';

@Injectable()
export class SimCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySimCodeDto) {
    const { page = 1, pageSize = 50, search, sort } = query;

    const where: Prisma.SimCodeWhereInput = {
      ...(search && { code: { contains: search, mode: 'insensitive' } }),
    };

    // Resolve orderBy — simCount requires a raw sort via _count
    const [sortField, sortDir = 'asc'] = (sort ?? 'code:asc').split(':');
    const direction = sortDir === 'desc' ? 'desc' : 'asc';

    let orderBy: Prisma.SimCodeOrderByWithRelationInput;
    if (sortField === 'simCount') {
      orderBy = { sims: { _count: direction } };
    } else if (sortField === 'createdAt') {
      orderBy = { createdAt: direction };
    } else {
      orderBy = { code: direction };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.simCode.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { sims: true } } },
      }),
      this.prisma.simCode.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const simCode = await this.prisma.simCode.findUnique({
      where: { id },
      include: { _count: { select: { sims: true } } },
    });
    if (!simCode) throw new NotFoundException(`SimCode ${id} không tồn tại`);
    return simCode;
  }

  async getSimIds(id: string): Promise<{ data: string[] }> {
    const simCode = await this.findOne(id);
    const sims = await this.prisma.sim.findMany({
      where: { simCodeLabel: simCode.code },
      select: { id: true },
    });
    return { data: sims.map((s) => s.id) };
  }

  async getSimsDetail(id: string, query: QuerySimCodeSimsDto) {
    const simCode = await this.findOne(id);
    const { page = 1, pageSize = 20, sort } = query;

    const where: Prisma.SimWhereInput = { simCodeLabel: simCode.code };

    const [sortField, sortDir = 'asc'] = (sort ?? 'phoneNumber:asc').split(':');
    const direction = sortDir === 'desc' ? 'desc' : 'asc';

    const allowedFields = [
      'phoneNumber',
      'usedMB',
      'status',
      'firstUsedAt',
    ] as const;
    const field = allowedFields.includes(sortField as any)
      ? sortField
      : 'phoneNumber';
    const orderBy: Prisma.SimOrderByWithRelationInput = { [field]: direction };

    const [sims, total] = await this.prisma.$transaction([
      this.prisma.sim.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          phoneNumber: true,
          usedMB: true,
          status: true,
          firstUsedAt: true,
          ratingPlanName: true,
        },
      }),
      this.prisma.sim.count({ where }),
    ]);

    return { data: sims, total, page, pageSize };
  }

  async create(dto: CreateSimCodeDto) {
    const existing = await this.prisma.simCode.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Mã SIM "${dto.code}" đã tồn tại`);
    }

    return this.prisma.$transaction(async (tx) => {
      const simCode = await tx.simCode.create({
        data: { code: dto.code, description: dto.description },
      });
      if (dto.simIds?.length) {
        await tx.sim.updateMany({
          where: { id: { in: dto.simIds } },
          data: { simCodeLabel: simCode.code },
        });
      }
      return simCode;
    });
  }

  async update(id: string, dto: UpdateSimCodeDto) {
    const simCode = await this.findOne(id);
    if (dto.code) {
      const existing = await this.prisma.simCode.findFirst({
        where: { code: dto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Mã SIM "${dto.code}" đã tồn tại`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.simCode.update({
        where: { id },
        data: {
          ...(dto.code && { code: dto.code }),
          ...('description' in dto && { description: dto.description ?? null }),
        },
      });
      const newCode = updated.code;

      // Replace SIM membership when simIds is explicitly provided
      if (dto.simIds !== undefined) {
        await tx.sim.updateMany({
          where: { simCodeLabel: simCode.code },
          data: { simCodeLabel: null },
        });
        if (dto.simIds.length > 0) {
          await tx.sim.updateMany({
            where: { id: { in: dto.simIds } },
            data: { simCodeLabel: newCode },
          });
        }
      } else if (dto.code && dto.code !== simCode.code) {
        await tx.sim.updateMany({
          where: { simCodeLabel: simCode.code },
          data: { simCodeLabel: newCode },
        });
      }

      return updated;
    });
  }

  async remove(id: string) {
    const simCode = await this.findOne(id);
    await this.prisma.sim.updateMany({
      where: { simCodeLabel: simCode.code },
      data: { simCodeLabel: null },
    });
    return this.prisma.simCode.delete({ where: { id } });
  }
}
