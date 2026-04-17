import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { QueryRatingPlanDto } from './dto/query-rating-plan.dto';

@Injectable()
export class RatingPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRatingPlanDto) {
    const { page = 1, pageSize = 50, search } = query;

    const where: Prisma.RatingPlanWhereInput = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.ratingPlan.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.ratingPlan.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }
}
