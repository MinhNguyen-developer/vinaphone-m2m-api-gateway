import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';

interface VinaphoneSimData {
  phoneNumber: string;
  imsi?: string;
  systemStatus?: string;
  usedMB?: number;
}

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression =
      this.configService.get<string>('syncCron') ?? '*/10 * * * *';
    const job = new CronJob(cronExpression, () => void this.syncSims());
    this.schedulerRegistry.addCronJob('syncSims', job);
    job.start();
    this.logger.log(`Sync cron scheduled: ${cronExpression}`);
  }

  async syncSims() {
    this.logger.log('Starting SIM sync from Vinaphone API...');

    try {
      const baseUrl = this.configService.get<string>('vinaphone.baseUrl');
      const apiKey = this.configService.get<string>('vinaphone.apiKey');
      const timeout = this.configService.get<number>('vinaphone.timeoutMs') ?? 10000;

      const { data: vinaphoneSims } = await firstValueFrom(
        this.httpService.get<VinaphoneSimData[]>(`${baseUrl}/sims`, {
          headers: { 'x-api-key': apiKey },
          timeout,
        }),
      );

      const now = new Date();
      const currentMonth = dayjs().format('YYYY-MM');

      for (const vSim of vinaphoneSims) {
        const sim = await this.prisma.sim.findUnique({
          where: { phoneNumber: vSim.phoneNumber },
        });
        if (!sim) continue;

        const newUsedMB = vSim.usedMB ?? sim.usedMB;

        const updateData: Record<string, unknown> = {
          usedMB: newUsedMB,
          syncedAt: now,
          ...(vSim.systemStatus && { systemStatus: vSim.systemStatus }),
        };

        // Auto-transition: Mới → Đã hoạt động when usedMB first becomes > 0
        if (sim.status === 'Mới' && newUsedMB > 0) {
          updateData['status'] = 'Đã hoạt động';
          updateData['firstUsedAt'] = now;
          this.logger.log(`SIM ${sim.phoneNumber} chuyển sang "Đã hoạt động"`);
        }

        await this.prisma.sim.update({ where: { id: sim.id }, data: updateData });

        // Upsert usage history for current month
        await this.prisma.usageHistory.upsert({
          where: { simId_month: { simId: sim.id, month: currentMonth } },
          update: { usedMB: newUsedMB },
          create: { simId: sim.id, month: currentMonth, usedMB: newUsedMB },
        });
      }

      await this.recalculateMasterSimUsage();

      this.logger.log(`Sync completed: ${vinaphoneSims.length} SIMs processed.`);
    } catch (err) {
      this.logger.error('Sync failed', (err as Error).stack);
    }
  }

  private async recalculateMasterSimUsage() {
    const masterSims = await this.prisma.masterSim.findMany();

    for (const ms of masterSims) {
      const agg = await this.prisma.sim.aggregate({
        _sum: { usedMB: true },
        where: { masterSimCode: ms.code },
      });

      await this.prisma.masterSim.update({
        where: { id: ms.id },
        data: {
          usedMB: agg._sum.usedMB ?? 0,
          syncedAt: new Date(),
        },
      });
    }
  }
}
