import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Sim } from '../generated/prisma/index.js';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAlertCheckDto } from './dto/update-alert-check.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { QueryAlertDto } from './dto/query-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: QueryAlertDto = {}) {
    const where: Prisma.AlertConfigWhereInput = {
      ...(dto.label && { label: { contains: dto.label, mode: 'insensitive' } }),
      ...(dto.active !== undefined && { active: dto.active }),
    };
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;

    const [alertConfigs, total] = await Promise.all([
      this.prisma.alertConfig.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.alertConfig.count({ where }),
    ]);

    return {
      data: alertConfigs.map((a) => ({
        id: a.id,
        label: a.label,
        thresholdMB: a.thresholdMB,
        groupId: a.groupId,
        simId: a.simId,
        productCode: a.productCode,
        ratingPlanId: a.ratingPlanId,
        active: a.active,
      })),
      total,
    };
  }

  async toggleActive(id: string) {
    const existing = await this.prisma.alertConfig.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`AlertConfig ${id} không tồn tại`);
    return this.prisma.alertConfig.update({
      where: { id },
      data: { active: !existing.active },
    });
  }

  async create(dto: CreateAlertDto) {
    const alert = await this.prisma.alertConfig.create({
      data: {
        label: dto.label,
        thresholdMB: dto.thresholdMB,
        simId: dto.simId ?? null,
        groupId: dto.groupId ?? null,
        ratingPlanId: dto.ratingPlanId ?? null,
        productCode: dto.productCode ?? null,
        active: dto.active ?? true,
      },
    });
    return alert;
  }

  async update(id: string, dto: UpdateAlertDto) {
    const existing = await this.prisma.alertConfig.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`AlertConfig ${id} không tồn tại`);
    return this.prisma.alertConfig.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.thresholdMB !== undefined && { thresholdMB: dto.thresholdMB }),
        ...(dto.simId !== undefined && { simId: dto.simId }),
        ...(dto.groupId !== undefined && { groupId: dto.groupId }),
        ...(dto.productCode !== undefined && { productCode: dto.productCode }),
        ...(dto.ratingPlanId !== undefined && {
          ratingPlanId: dto.ratingPlanId,
        }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.alertConfig.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`AlertConfig ${id} không tồn tại`);
    await this.prisma.alertConfig.delete({ where: { id } });
  }

  async findTriggered(ratingPlanId?: number) {
    const activeAlerts = await this.prisma.alertConfig.findMany({
      where: {
        active: true,
        ...(ratingPlanId && { ratingPlanId }),
      },
    });

    const results: Array<{
      sim: Sim;
      alert: { id: string; label: string; thresholdMB: number };
      checked: boolean;
    }> = [];

    for (const alert of activeAlerts) {
      const simWhere: Prisma.SimWhereInput = {
        usedMB: { gte: alert.thresholdMB },
        ...(alert.simId && { id: alert.simId }),
        ...(alert.groupId && {
          simGroups: { some: { groupId: alert.groupId } },
        }),
        ...(alert.productCode && { productCode: alert.productCode }),
        ...(alert.ratingPlanId && { ratingPlanId: alert.ratingPlanId }),
      };

      const sims = await this.prisma.sim.findMany({ where: simWhere });

      for (const sim of sims) {
        const check = await this.prisma.alertCheck.findUnique({
          where: { simId_alertId: { simId: sim.id, alertId: alert.id } },
        });

        results.push({
          sim,
          alert,
          checked: check?.checked ?? false,
        });
      }
    }

    return { data: results, total: results.length };
  }

  async updateCheck(
    simId: string,
    alertId: string,
    dto: UpdateAlertCheckDto,
    username: string,
  ) {
    const sim = await this.prisma.sim.findUnique({ where: { id: simId } });
    if (!sim) throw new NotFoundException(`SIM ${simId} không tồn tại`);

    const alert = await this.prisma.alertConfig.findUnique({
      where: { id: alertId },
    });
    if (!alert)
      throw new NotFoundException(`AlertConfig ${alertId} không tồn tại`);

    return this.prisma.alertCheck.upsert({
      where: { simId_alertId: { simId, alertId } },
      update: {
        checked: dto.checked,
        checkedAt: dto.checked ? new Date() : null,
        checkedBy: dto.checked ? username : null,
      },
      create: {
        simId,
        alertId,
        checked: dto.checked,
        checkedAt: dto.checked ? new Date() : null,
        checkedBy: dto.checked ? username : null,
      },
    });
  }
}
