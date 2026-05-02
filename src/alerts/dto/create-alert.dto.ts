import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAlertDto {
  @ApiProperty({ description: 'Tên hiển thị cho cảnh báo' })
  @IsString()
  label!: string;

  @ApiProperty({ description: 'Ngưỡng dung lượng (MB)' })
  @IsInt()
  @Min(1)
  thresholdMB!: number;

  @ApiPropertyOptional({ description: 'UUID của SIM (nếu áp dụng cho 1 SIM)' })
  @IsOptional()
  @IsUUID('4')
  simId?: string;

  @ApiPropertyOptional({
    description: 'UUID nhóm thiết bị (nếu áp dụng cho nhóm)',
  })
  @IsOptional()
  @IsUUID('4')
  groupId?: string;

  @ApiPropertyOptional({ description: 'Mã sản phẩm (nếu áp dụng cho mã SP)' })
  @IsOptional()
  @IsString()
  productCode?: string;

  @ApiPropertyOptional({
    description: 'ID gói cước (nếu áp dụng cho gói cước)',
  })
  @IsOptional()
  @IsInt()
  ratingPlanId?: number;

  @ApiPropertyOptional({ description: 'Kích hoạt cảnh báo', default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
