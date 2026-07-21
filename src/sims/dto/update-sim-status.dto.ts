import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { SimStatus } from '../../types/common';

export enum SimStatusAction {
  CONFIRM = 'confirm',
  RESET = 'reset',
  CANCEL = 'cancel',
  LOCK = 'lock',
  PENDING_CANCEL = 'pending_cancel',
  PENDING_LOCK = 'pending_lock',
  PENDING_REVOKE = 'pending_revoke',
}

export class UpdateSimStatusDto {
  @ApiProperty({ enum: SimStatusAction })
  @IsEnum(SimStatusAction)
  action!: SimStatusAction;
}

export class BatchUpdateSimStatusDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids!: string[];

  @ApiProperty({
    enum: SimStatus,
    description: 'Trạng thái cần chuyển cho danh sách SIM',
  })
  @IsEnum(SimStatus)
  status!: SimStatus;
}

export class BulkCancelSimsByPhoneDto {
  @ApiProperty({
    type: [String],
    description:
      'Danh sách IMSI cần hủy (chỉ lấy 10 số cuối) hoặc số điện thoại',
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null) {
      return value;
    }

    const values = Array.isArray(value) ? value : [value];

    return values.map((item) =>
      typeof item === 'string' || typeof item === 'number'
        ? String(item)
        : item,
    );
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  numbers?: string[];
}

export class BulkResetSimsByPhoneDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách IMSI cần hủy (chỉ lấy 10 số cuối)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imsis?: string[];
}

export class BulkLockSimsByPhoneDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách IMSI cần hủy (chỉ lấy 10 số cuối)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imsis?: string[];
}

export class BulkPendingCancelSimsByPhoneDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách IMSI cần hủy (chỉ lấy 10 số cuối)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imsis?: string[];
}

export class BulkPendingLockSimsByPhoneDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách IMSI cần khoá (chỉ lấy 10 số cuối)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imsis?: string[];
}

export class BulkPendingRevokeSimsByPhoneDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách IMSI cần thu hồi (chỉ lấy 10 số cuối)',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imsis?: string[];
}
