import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

// Allowed sortable columns (whitelist to prevent arbitrary field injection)
const SORTABLE_FIELDS = [
  'phoneNumber',
  'imsi',
  'status',
  'simType',
  'usedMB',
  'activatedDate',
  'createdAt',
] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];
type SortOrder = 'asc' | 'desc';
export type ParsedSort = { field: SortableField; order: SortOrder }[];

/**
 * Parse "phoneNumber:asc,status:desc" → [{ field, order }, ...]
 * Silently drops any entry with an unrecognised field or direction.
 */
export function parseSortParam(raw: string | undefined): ParsedSort {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .flatMap((segment) => {
      const [field, order = 'asc'] = segment.split(':');
      if (
        !SORTABLE_FIELDS.includes(field as SortableField) ||
        !['asc', 'desc'].includes(order)
      )
        return [];
      return [{ field: field as SortableField, order: order as SortOrder }];
    });
}

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

  @ApiPropertyOptional({ description: 'Tìm theo tên nhóm thuê bao' })
  @IsOptional()
  @Type(() => String)
  @IsString()
  groupName?: string;

  @ApiPropertyOptional({
    description: 'Tìm theo loại SIM (0: Sim M2M, 1: eSIM)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  simType?: number;

  @ApiPropertyOptional({
    description:
      'Sort by one or more fields. Format: "field:asc" or comma-separated "field:asc,field2:desc". ' +
      'Allowed fields: phoneNumber, imsi, status, simType, usedMB, activatedDate, createdAt.',
    example: 'phoneNumber:asc',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([a-zA-Z]+:(asc|desc))(,[a-zA-Z]+:(asc|desc))*$/, {
    message: 'sort must be "field:asc" or "field:asc,field2:desc"',
  })
  sort?: string;
}
