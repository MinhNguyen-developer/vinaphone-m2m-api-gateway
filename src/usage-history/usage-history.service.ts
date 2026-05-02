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

    const history = await this.prisma.monthlyDataUsage.findMany({
      where: {
        msisdn: sim.phoneNumber,
        ...(fromMonth && { month: { gte: fromMonth } }),
        ...(toMonth && { month: { lte: toMonth } }),
      },
      orderBy: { month: 'asc' },
    });

    return {
      phoneNumber: sim.phoneNumber,
      imsi: sim.imsi,
      history: history,
    };
  }
}
