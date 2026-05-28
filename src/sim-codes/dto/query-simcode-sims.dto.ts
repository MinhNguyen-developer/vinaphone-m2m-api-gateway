import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QuerySimCodeSimsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  /** e.g. "phoneNumber:asc", "usedMB:desc", "status:asc", "firstUsedAt:desc" */
  @IsOptional()
  @IsString()
  sort?: string;
}
