import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const groups = await this.prisma.group.findMany({
      include: { _count: { select: { simGroups: true } } },
    });

    return {
      data: groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description ?? '',
        simCount: g._count.simGroups,
        createdAt: g.createdAt,
      })),
    };
  }
}
