import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PaginatedResult } from 'src/types/common';
import { Group, Prisma } from 'src/generated/prisma';
import { QueryGroupDto } from './dto/query-group.dto';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryGroupDto): Promise<PaginatedResult<Group>> {
    const { page = 1, pageSize = 50, search, sort } = query;

    const [sortField, sortDirRaw] = (sort ?? '').split(':');
    const sortDir = sortDirRaw === 'desc' ? 'desc' : 'asc';

    const where: Prisma.GroupWhereInput = {
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    };

    // totalUsedMB is a computed aggregate — requires raw SQL for correct pagination
    if (sortField === 'totalUsedMB') {
      const searchFilter = search
        ? Prisma.sql`WHERE g.name ILIKE ${`%${search}%`}`
        : Prisma.sql``;
      const direction = sortDir === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
      const offset = (page - 1) * pageSize;

      const [countResult, rawGroups] = await Promise.all([
        this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(DISTINCT g.id) AS count
          FROM groups g
          ${searchFilter}
        `,
        this.prisma.$queryRaw<
          {
            id: string;
            name: string;
            description: string | null;
            created_at: Date;
            sim_count: bigint;
            total_used_mb: bigint;
          }[]
        >`
          SELECT
            g.id,
            g.name,
            g.description,
            g.created_at,
            COUNT(sg.sim_id) AS sim_count,
            COALESCE(SUM(s.used_mb), 0) AS total_used_mb
          FROM groups g
          LEFT JOIN sim_groups sg ON sg.group_id = g.id
          LEFT JOIN sims s ON s.id = sg.sim_id
          ${searchFilter}
          GROUP BY g.id, g.name, g.description, g.created_at
          ORDER BY total_used_mb ${direction}
          LIMIT ${pageSize} OFFSET ${offset}
        `,
      ]);

      return {
        data: rawGroups.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description ?? '',
          simCount: Number(g.sim_count),
          totalUsedMB: Number(g.total_used_mb),
          createdAt: g.created_at,
        })) as unknown as Group[],
        total: Number(countResult[0]?.count ?? 0),
        page,
        pageSize,
      };
    }

    // Standard Prisma orderBy for name / createdAt
    let orderBy: Prisma.GroupOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortField === 'name') orderBy = { name: sortDir };
    else if (sortField === 'createdAt') orderBy = { createdAt: sortDir };

    const [groups, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        include: {
          _count: { select: { simGroups: true } },
          simGroups: { include: { sim: { select: { usedMB: true } } } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      data: groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description ?? '',
        simCount: g._count.simGroups,
        totalUsedMB: g.simGroups.reduce((acc, sg) => acc + sg.sim.usedMB, 0),
        createdAt: g.createdAt,
      })) as unknown as Group[],
      total,
      page,
      pageSize,
    };
  }

  async getAllGroups() {
    const groups = await this.prisma.group.findMany();

    return {
      data: groups,
    };
  }

  async getSimIds(id: string) {
    await this.findOneOrThrow(id);
    const simGroups = await this.prisma.simGroup.findMany({
      where: { groupId: id },
      select: { simId: true },
    });
    return { data: simGroups.map((sg) => sg.simId) };
  }

  async create(dto: CreateGroupDto) {
    return this.prisma.$transaction(async (tx) => {
      const simIds = await this.resolveSimIds(
        tx,
        dto.simIds,
        dto.simIdentifiers,
      );
      const group = await tx.group.create({
        data: {
          name: dto.name,
          description: dto.description,
          simGroups: simIds.length
            ? { create: simIds.map((simId) => ({ simId })) }
            : undefined,
        },
        include: { _count: { select: { simGroups: true } } },
      });
      return {
        id: group.id,
        name: group.name,
        description: group.description ?? '',
        simCount: group._count.simGroups,
        createdAt: group.createdAt,
      };
    });
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.findOneOrThrow(id);

    return this.prisma.$transaction(async (tx) => {
      const hasSimMembershipUpdate =
        dto.simIds !== undefined || dto.simIdentifiers !== undefined;
      const simIds = hasSimMembershipUpdate
        ? await this.resolveSimIds(tx, dto.simIds, dto.simIdentifiers)
        : undefined;

      const group = await tx.group.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
        },
      });

      // If SIM identifiers are provided, replace all sim memberships.
      if (simIds !== undefined) {
        await tx.simGroup.deleteMany({ where: { groupId: id } });
        if (simIds.length > 0) {
          await tx.simGroup.createMany({
            data: simIds.map((simId) => ({ simId, groupId: id })),
            skipDuplicates: true,
          });
        }
      }

      const updated = await tx.group.findUnique({
        where: { id },
        include: { _count: { select: { simGroups: true } } },
      });
      return {
        id: updated!.id,
        name: updated!.name,
        description: updated!.description ?? '',
        simCount: updated!._count.simGroups,
        createdAt: updated!.createdAt,
      };
    });
  }

  async remove(id: string) {
    await this.findOneOrThrow(id);
    await this.prisma.group.delete({ where: { id } });
  }

  private async findOneOrThrow(id: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException(`Nhóm ${id} không tồn tại`);
    return group;
  }

  private async resolveSimIds(
    db: PrismaService | Prisma.TransactionClient,
    simIds?: string[],
    simIdentifiers?: string[],
  ): Promise<string[]> {
    const resolvedIds = new Set(simIds ?? []);
    const identifiers = Array.from(
      new Set(
        (simIdentifiers ?? [])
          .map((identifier) => identifier.trim())
          .filter(Boolean),
      ),
    );

    if (identifiers.length > 0) {
      const sims = await db.sim.findMany({
        where: {
          OR: [
            { phoneNumber: { in: identifiers } },
            { imsi: { in: identifiers } },
          ],
        },
        select: { id: true, phoneNumber: true, imsi: true },
      });
      const identifierToId = new Map<string, string>();
      sims.forEach((sim) => {
        identifierToId.set(sim.phoneNumber, sim.id);
        if (sim.imsi) identifierToId.set(sim.imsi, sim.id);
        resolvedIds.add(sim.id);
      });

      const notFound = identifiers.filter(
        (identifier) => !identifierToId.has(identifier),
      );
      if (notFound.length > 0) {
        throw new BadRequestException(
          'Không tìm thấy SIM theo số điện thoại hoặc IMSI: ' +
            notFound.join(', '),
        );
      }
    }

    if (resolvedIds.size > 0) {
      const existing = await db.sim.findMany({
        where: { id: { in: Array.from(resolvedIds) } },
        select: { id: true },
      });
      if (existing.length !== resolvedIds.size) {
        const existingIds = new Set(existing.map((sim) => sim.id));
        const notFoundIds = Array.from(resolvedIds).filter(
          (simId) => !existingIds.has(simId),
        );
        throw new BadRequestException(
          'Không tìm thấy SIM theo ID: ' + notFoundIds.join(', '),
        );
      }
    }

    return Array.from(resolvedIds);
  }
}
