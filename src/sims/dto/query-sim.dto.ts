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

  @ApiPropertyOptional({ description: 'Tìm theo SĐT, IMSI, hoặc mã hợp đồng' })
  @IsOptional()
  @IsString()
  search?: string;
}
