import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Sim } from '../generated/prisma/index.js';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAlertCheckDto } from './dto/update-alert-check.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const alertConfigs = await this.prisma.alertConfig.findMany();
    return {
      data: alertConfigs.map((a) => ({
        id: a.id,
        label: a.label,
        thresholdMB: a.thresholdMB,
        groupId: a.groupId,
        simId: a.simId,
        productCode: a.productCode,
        active: a.active,
      })),
    };
  }

  async findTriggered(productCode?: string) {
    const activeAlerts = await this.prisma.alertConfig.findMany({
      where: { active: true },
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
        ...(productCode && { productCode }),
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

    const alert = await this.prisma.alertConfig.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException(`AlertConfig ${alertId} không tồn tại`);

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
