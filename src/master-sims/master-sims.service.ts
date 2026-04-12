import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MasterSimsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const masterSims = await this.prisma.masterSim.findMany();
    return {
      data: masterSims.map((ms) => ({
        id: ms.id,
        code: ms.code,
        phoneNumber: ms.phoneNumber,
        packageName: ms.packageName,
        packageCapacityMB: ms.packageCapacityMB,
        usedMB: ms.usedMB,
        remainingMB: ms.packageCapacityMB - ms.usedMB,
        description: ms.description ?? '',
      })),
    };
  }

  async findMembers(code: string, query: Record<string, unknown> = {}) {
    const masterSim = await this.prisma.masterSim.findUnique({ where: { code } });
    if (!masterSim) throw new NotFoundException(`SIM chủ ${code} không tồn tại`);

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
