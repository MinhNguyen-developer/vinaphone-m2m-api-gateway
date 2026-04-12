import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhoneNumber(
    phoneNumber: string,
    fromMonth?: string,
    toMonth?: string,
  ) {
    const sim = await this.prisma.sim.findUnique({ where: { phoneNumber } });
    if (!sim) throw new NotFoundException(`SIM ${phoneNumber} không tồn tại`);

    const history = await this.prisma.usageHistory.findMany({
      where: {
        simId: sim.id,
        ...(fromMonth && { month: { gte: fromMonth } }),
        ...(toMonth && { month: { lte: toMonth } }),
      },
      orderBy: { month: 'asc' },
    });

    return {
      phoneNumber: sim.phoneNumber,
      imsi: sim.imsi,
      history: history.map((h) => ({ month: h.month, usedMB: h.usedMB })),
    };
  }
}
