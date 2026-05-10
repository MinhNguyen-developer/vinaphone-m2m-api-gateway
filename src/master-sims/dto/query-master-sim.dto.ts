import { IsOptional, IsInt, IsString, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryMasterSimDto {
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

  @ApiPropertyOptional({ description: 'Tìm theo SĐT/IMSI/hợp đồng' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tìm theo số điện thoại' })
  @IsOptional()
  @IsString()
  msisdn?: string;

  @ApiPropertyOptional({ description: 'Tìm theo IMSI' })
  @IsOptional()
  @IsString()
  imsi?: string;

  @ApiPropertyOptional({ description: 'Tìm theo mã hợp đồng' })
  @IsOptional()
  @IsString()
  contractCode?: string;

  @ApiPropertyOptional({ description: 'Lọc theo gói cước' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  ratingPlanId?: number;

  @ApiPropertyOptional({
    description:
      'Sắp xếp. Format: "field:asc" hoặc "field:desc". ' +
      'Allowed: phoneNumber, imsi, ratingPlanName, usedMB, contractCode.',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Lọc theo nhóm thiết bị (UUID)' })
  @IsOptional()
  @IsUUID('4')
  groupId?: string;
}
