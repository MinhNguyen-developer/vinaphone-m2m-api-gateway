import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QuerySimGroupDto } from './dto/query-sim-group.dto';
import { Prisma } from 'src/generated/prisma';

@Injectable()
export class SimGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async getSimGroups(query: QuerySimGroupDto) {
    const { page = 1, pageSize = 50, search } = query;

    const where: Prisma.GroupSimWhereInput = search
      ? {
          name: { contains: search, mode: 'insensitive' },
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.groupSim.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.groupSim.count({ where }),
    ]);
    return { data, total };
  }
}
