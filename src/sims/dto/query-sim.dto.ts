import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QuerySimDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  masterSimCode?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'] })
  @IsOptional()
  @IsString()
  systemStatus?: string;

  @ApiPropertyOptional({ enum: ['Mới', 'Đã hoạt động', 'Đã xác nhận'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Tìm theo SĐT' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tìm theo mã hợp đồng' })
  @IsOptional()
  @IsString()
  contractCode?: string;

  @ApiPropertyOptional({ description: 'Tìm theo IMSI' })
  @IsOptional()
  @IsString()
  imsi?: string;

  @ApiPropertyOptional({ description: 'Tìm theo gói cước' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ratingPlanId?: number;
}
