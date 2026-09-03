import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Sim } from '../generated/prisma/index.js';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAlertCheckDto } from './dto/update-alert-check.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { QueryAlertDto } from './dto/query-alert.dto';
import { QueryTriggeredDto } from './dto/query-triggered.dto';
import { BulkCheckDto } from './dto/bulk-check.dto';
import { BulkCheckStatusDto } from './dto/bulk-check-status.dto';

type TriggerableAlertConfig = {
  id: string;
  label: string;
  thresholdMB: number;
  simId: string | null;
  groupId: string | null;
  productCode: string | null;
  ratingPlanId: number | null;
  simCodeLabel: string | null;
};

type TriggerableSim = Sim & {
  simGroups: Array<{ groupId: string; group: { id: string; name: string } | null }>;
  simCode: { id: string; code: string } | null;
};

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildSimWhereForAlert(
    alert: TriggerableAlertConfig,
    extraConditions: Prisma.SimWhereInput[] = [],
  ): Prisma.SimWhereInput {
    const conditions: Prisma.SimWhereInput[] = [
      ...extraConditions,
      { usedMB: { gte: alert.thresholdMB } },
    ];

    if (alert.simId) {
      conditions.push({ id: alert.simId });
    }
    if (alert.groupId) {
      conditions.push({ simGroups: { some: { groupId: alert.groupId } } });
    }
    if (alert.productCode) {
      conditions.push({ productCode: alert.productCode });
    }
    if (alert.ratingPlanId) {
      conditions.push({ ratingPlanId: alert.ratingPlanId });
    }
    if (alert.simCodeLabel) {
      conditions.push({ simCodeLabel: alert.simCodeLabel });
    }

    return { AND: conditions };
  }

  private async ensureTriggeredAlert(
    sim: TriggerableSim,
    alert: TriggerableAlertConfig,
  ): Promise<{
    created: boolean;
    check: { checked: boolean; triggeredAt: Date | null };
  }> {
    let check = await this.prisma.alertCheck.findUnique({
      where: { simId_alertId: { simId: sim.id, alertId: alert.id } },
    });

    let created = false;

    if (!check) {
      check = await this.prisma.alertCheck.create({
        data: {
          simId: sim.id,
          alertId: alert.id,
          checked: false,
          checkedAt: null,
          checkedBy: null,
          triggeredAt: new Date(),
        },
      });
      created = true;
    } else if (!check.checked && !check.triggeredAt) {
      check = await this.prisma.alertCheck.update({
        where: { simId_alertId: { simId: sim.id, alertId: alert.id } },
        data: { triggeredAt: new Date() },
      });
    }

    return {
      created,
      check: {
        checked: check.checked,
        triggeredAt: check.triggeredAt ?? null,
      },
    };
  }

  async findAll(dto: QueryAlertDto = {}) {
    const where: Prisma.AlertConfigWhereInput = {
      ...(dto.label && { label: { contains: dto.label, mode: 'insensitive' } }),
      ...(dto.status !== undefined && { status: dto.status }),
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
        simCodeLabel: a.simCodeLabel,
        status: a.status,
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
    // Toggle between status 1 (Mới) and 2 (Đã kiểm tra) — 1-way for AlertConfig status is separate
    // This endpoint is kept for backward compat but is no longer the primary status toggle
    return this.prisma.alertConfig.update({
      where: { id },
      data: { status: existing.status === 1 ? 2 : 1 },
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
        simCodeLabel: dto.simCodeLabel ?? null,
        status: dto.status ?? 1,
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
        ...(dto.simCodeLabel !== undefined && {
          simCodeLabel: dto.simCodeLabel,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
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

  async syncTriggeredAlertsBySimIds(simIds: string[] = []) {
    const distinctSimIds = [...new Set(simIds.filter(Boolean))];
    if (distinctSimIds.length === 0) return 0;

    const activeAlerts = await this.prisma.alertConfig.findMany({
      where: { status: 1 },
    });

    let createdCount = 0;

    for (const alert of activeAlerts) {
      const sims = await this.prisma.sim.findMany({
        where: this.buildSimWhereForAlert(alert, [{ id: { in: distinctSimIds } }]),
        include: {
          simGroups: {
            include: { group: true },
          },
          simCode: { select: { id: true, code: true } },
        },
      });

      for (const sim of sims as TriggerableSim[]) {
        const { created, check } = await this.ensureTriggeredAlert(sim, alert);
        if (check.checked) continue;
        if (created) createdCount++;
      }
    }

    return createdCount;
  }

  async findTriggered(dto: QueryTriggeredDto = {}) {
    // Only AlertConfigs with status=1 (Mới) are considered "active"
    const activeAlerts = await this.prisma.alertConfig.findMany({
      where: {
        status: 1,
        label: dto.alertLabel
          ? { contains: dto.alertLabel, mode: 'insensitive' }
          : undefined,
      },
    });

    const results: Array<{
      sim: Sim & {
        simGroups: Array<{ group: { id: string; name: string } | null }>;
      };
      alert: { id: string; label: string; thresholdMB: number };
      checked: boolean;
      triggeredAt: Date | null;
    }> = [];

    for (const alert of activeAlerts) {
      const simWhere = this.buildSimWhereForAlert(alert, [
        ...(dto.groupId
          ? [{ simGroups: { some: { groupId: dto.groupId } } }]
          : []),
        ...(dto.simCodeLabel ? [{ simCodeLabel: dto.simCodeLabel }] : []),
      ]);

      const sims = await this.prisma.sim.findMany({
        where: simWhere,
        include: {
          simGroups: {
            include: { group: true },
          },
          simCode: { select: { id: true, code: true } },
        },
      });

      for (const sim of sims) {
        const { check } = await this.ensureTriggeredAlert(sim as TriggerableSim, alert);

        // Only return unchecked items
        if (check.checked) continue;

        results.push({
          sim,
          alert,
          checked: false,
          triggeredAt: check.triggeredAt ?? null,
        });
      }
    }

    // Server-side sort by usedMB
    if (dto.sort) {
      const [field, dir] = dto.sort.split(':');
      if (field === 'usedMB') {
        results.sort((a, b) =>
          dir === 'asc'
            ? a.sim.usedMB - b.sim.usedMB
            : b.sim.usedMB - a.sim.usedMB,
        );
      }
    }

    return { data: results, total: results.length };
  }

  async bulkCheckAlerts(dto: BulkCheckDto, username: string) {
    const { phoneNumbers } = dto;
    const normalised = phoneNumbers.map((p) => p.trim()).filter(Boolean);

    const sims = await this.prisma.sim.findMany({
      where: { phoneNumber: { in: normalised } },
      include: {
        simGroups: { include: { group: true } },
      },
    });

    const activeAlerts = await this.prisma.alertConfig.findMany({
      where: { status: 1 },
    });

    type CheckedResult = {
      phoneNumber: string;
      usedMB: number;
      alertLabel: string;
      thresholdMB: number;
      groupNames: string[];
    };
    const checkedResults: CheckedResult[] = [];

    for (const sim of sims) {
      const groupNames = sim.simGroups
        .map((sg) => sg.group?.name)
        .filter(Boolean) as string[];

      for (const alert of activeAlerts) {
        if (sim.usedMB < alert.thresholdMB) continue;

        // Check scope: alert must apply to this SIM
        const scopeMatch =
          (!alert.simId &&
            !alert.groupId &&
            !alert.productCode &&
            !alert.ratingPlanId) ||
          (alert.simId && alert.simId === sim.id) ||
          (alert.groupId &&
            sim.simGroups.some((sg) => sg.groupId === alert.groupId)) ||
          (alert.productCode && alert.productCode === sim.productCode) ||
          (alert.ratingPlanId && alert.ratingPlanId === sim.ratingPlanId);

        if (!scopeMatch) continue;

        await this.prisma.alertCheck.upsert({
          where: { simId_alertId: { simId: sim.id, alertId: alert.id } },
          update: {
            checked: true,
            checkedAt: new Date(),
            checkedBy: username,
          },
          create: {
            simId: sim.id,
            alertId: alert.id,
            checked: true,
            triggeredAt: new Date(),
            checkedAt: new Date(),
            checkedBy: username,
          },
        });

        checkedResults.push({
          phoneNumber: sim.phoneNumber,
          usedMB: sim.usedMB,
          alertLabel: alert.label,
          thresholdMB: alert.thresholdMB,
          groupNames,
        });
      }
    }

    const notFound = normalised.filter(
      (p) => !sims.some((s) => s.phoneNumber === p),
    );

    return {
      checked: checkedResults.length,
      notFound: notFound.length,
      notFoundPhones: notFound,
      results: checkedResults,
    };
  }

  /** Bulk set status=2 (Đã kiểm tra) on AlertConfig records by id (1-way only) */
  async bulkCheckStatus(dto: BulkCheckStatusDto) {
    const result = await this.prisma.alertConfig.updateMany({
      where: { id: { in: dto.ids }, status: 1 },
      data: { status: 2 },
    });
    return { checked: result.count, requested: dto.ids.length };
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
        triggeredAt: new Date(),
        checkedAt: dto.checked ? new Date() : null,
        checkedBy: dto.checked ? username : null,
      },
    });
  }
}
