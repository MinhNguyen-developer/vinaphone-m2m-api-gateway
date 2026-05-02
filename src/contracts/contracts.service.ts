import { Injectable } from '@nestjs/common';
import { QueryContractDto } from './dto/query-contract.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Contract, Prisma } from '../generated/prisma/index.js';
import mapPopulateToSelectInput from 'src/utils/mapPopulateToSelectInput';
import mapSortStringToOrderInput from 'src/utils/mapSortStringToOrderInput';
import { FindOneResult, PaginatedResult } from '../types/common';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryContractDto): Promise<PaginatedResult<Contract>> {
    const { sort, populate, contractCode } = query;
    const page = query.page || 1;
    const pageSize = query.pageSize || 50;

    const where: Prisma.ContractWhereInput = {
      contractCode: {
        contains: contractCode,
        mode: 'insensitive',
      },
    };

    const orderBy: Prisma.ContractOrderByWithRelationInput[] =
      mapSortStringToOrderInput<Contract>(sort, ['contractCode']);

    const [contracts, total] = await this.prisma.$transaction([
      this.prisma.contract.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        ...(populate && {
          select: mapPopulateToSelectInput<Contract>(populate),
        }),
        ...(sort && { orderBy }),
      }),
      this.prisma.contract.count({ where }),
    ]);
    return { data: contracts, total, page, pageSize };
  }

  async findOne(id: string): Promise<FindOneResult<Contract>> {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
    });
    return { data: contract };
  }
}
