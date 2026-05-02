import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Contract } from '../../generated/prisma/index.js';

export class QueryContractDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;

  @ApiPropertyOptional({ description: "Populate fields, e.g. ['sims']" })
  @IsOptional()
  @IsArray({ each: true })
  populate?: (keyof Contract)[];

  @ApiPropertyOptional({
    description: "Sort by fields, e.g. 'createdAt:desc,code:asc'",
  })
  @IsOptional()
  @IsString()
  @Matches(/^(\w+:(asc|desc))(,\s*\w+:(asc|desc))*$/, {
    message:
      "Sort must be in the format 'field:direction,field2:direction2', where direction is 'asc' or 'desc'",
  })
  sort?: string;

  @ApiPropertyOptional({
    description: 'Filter by contract code (partial match)',
  })
  @IsOptional()
  @IsString()
  contractCode?: string;
}
