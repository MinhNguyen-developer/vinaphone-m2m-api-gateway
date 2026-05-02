import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOverview() {
    const [
      totalSims,
      newSims,
      needConfirmationSims,
      confirmedSims,
      simsWithAlert,
    ] = await this.prismaService.$transaction([
      this.prismaService.sim.count(),
      this.prismaService.sim.count({
        where: { status: 1 }, // Mới
      }),
      this.prismaService.sim.count({
        where: {
          status: 2, // Active, need confirmation
        },
      }),
      this.prismaService.sim.count({
        where: {
          status: 3, // Active, confirmed
        },
      }),
      // Count SIMs that match at least one active alert config:
      // either directly by simId, or via a group they belong to, or by productCode
      this.prismaService.sim.count({
        where: {
          OR: [
            // Alert targeting this SIM directly
            {
              alertConfigs: {
                some: { active: true },
              },
            },
            // Alert targeting a group this SIM belongs to
            {
              simGroups: {
                some: {
                  group: {
                    alertConfigs: {
                      some: { active: true },
                    },
                  },
                },
              },
            },
            // Alert targeting the SIM's product code
            {
              AND: [
                { productCode: { not: undefined } },
                {
                  productCode: {
                    in: await this.prismaService.alertConfig
                      .findMany({
                        where: { active: true, productCode: { not: null } },
                        select: { productCode: true },
                      })
                      .then((rows) =>
                        rows
                          .map((r) => r.productCode)
                          .filter((c): c is string => c !== null),
                      ),
                  },
                },
              ],
            },
          ],
        },
      }),
    ]);

    return {
      totalSims,
      newSims,
      needConfirmationSims,
      confirmedSims,
      simsWithAlert,
    };
  }
}
