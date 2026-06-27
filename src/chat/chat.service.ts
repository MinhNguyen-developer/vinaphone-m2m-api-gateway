import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CreateChatDto } from './dto/create-chat.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async streamChat(dto: CreateChatDto, res: Response): Promise<void> {
    // Set SSE headers before any data is written
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx response buffering
    res.flushHeaders();

    const agentUrl = this.config.get<string>('aiAgentUrl');

    try {
      const upstream = await this.httpService.axiosRef.post(
        `${agentUrl}/chat/stream`,
        dto,
        { responseType: 'stream', timeout: 120_000 },
      );

      upstream.data.pipe(res);

      upstream.data.on('error', (err: Error) => {
        this.logger.error('Upstream SSE stream error', err.message);
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`,
          );
          res.end();
        }
      });

      upstream.data.on('end', () => {
        if (!res.writableEnded) res.end();
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'AI agent unavailable';
      this.logger.error('Failed to connect to AI agent', message);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
        res.end();
      }
    }
  }

  async indexData(): Promise<{ message: string; stats: Record<string, number> }> {
    const agentUrl = this.config.get<string>('aiAgentUrl');

    // Fetch all entities from the database in parallel
    const [sims, alerts, groups, masterSims, usageHistory] = await Promise.all([
      this.prisma.sim.findMany({
        select: {
          id: true,
          phoneNumber: true,
          status: true,
          usedMB: true,
          productCode: true,
          ratingPlanName: true,
          simType: true,
          sogGroupId: true,
          sogGroupName: true,
          sogMaster: true,
          sogIsOwner: true,
          customerName: true,
          contractCode: true,
          simCodeLabel: true,
          note: true,
          groupName: true,
          provinceCode: true,
          createdAt: true,
          firstUsedAt: true,
        },
      }),
      this.prisma.alertConfig.findMany({
        select: {
          id: true,
          label: true,
          thresholdMB: true,
          status: true,
          simId: true,
          groupId: true,
          productCode: true,
          ratingPlanId: true,
          simCodeLabel: true,
          createdAt: true,
        },
      }),
      this.prisma.group.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: { select: { simGroups: true } },
        },
      }),
      this.prisma.masterSim.findMany({
        select: {
          id: true,
          code: true,
          phoneNumber: true,
          packageName: true,
          packageCapacityMB: true,
          usedMB: true,
          description: true,
        },
      }),
      this.prisma.usageHistory.findMany({
        select: {
          simId: true,
          month: true,
          usedMB: true,
          sim: { select: { phoneNumber: true } },
        },
        orderBy: { month: 'desc' },
        take: 10_000, // cap at last 10k records
      }),
    ]);

    const payload = {
      sims: sims.map((s) => ({
        ...s,
        createdAt: s.createdAt?.toISOString() ?? null,
        firstUsedAt: s.firstUsedAt?.toISOString() ?? null,
      })),
      alerts: alerts.map((a) => ({
        ...a,
        createdAt: a.createdAt?.toISOString() ?? null,
      })),
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        simCount: g._count.simGroups,
        createdAt: g.createdAt?.toISOString() ?? null,
      })),
      master_sims: masterSims,
      usage_history: usageHistory.map((u) => ({
        simId: u.simId,
        phoneNumber: u.sim.phoneNumber,
        month: u.month,
        usedMB: u.usedMB,
      })),
    };

    const stats = {
      sims: sims.length,
      alerts: alerts.length,
      groups: groups.length,
      masterSims: masterSims.length,
      usageHistory: usageHistory.length,
    };

    this.logger.log(
      `Sending index payload to AI agent: ${JSON.stringify(stats)}`,
    );

    await this.httpService.axiosRef.post(`${agentUrl}/index`, payload, {
      timeout: 300_000, // 5 min — allow time for embedding all records
    });

    return { message: 'Indexing completed', stats };
  }
}
