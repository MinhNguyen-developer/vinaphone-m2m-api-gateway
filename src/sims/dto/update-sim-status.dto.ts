import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

class BulkSimIdentifiersDto {
  @ApiPropertyOptional({
    type: [String],
    description:
      'Danh sách số điện thoại hoặc IMSI cần thao tác (IMSI có thể truyền đủ hoặc 10 số cuối)',
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

  @ApiPropertyOptional({
    type: [String],
    description: 'Payload cũ, giữ tương thích: danh sách IMSI',
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
  imsis?: string[];
}

export class BulkCancelSimsByPhoneDto extends BulkSimIdentifiersDto {}

export class BulkResetSimsByPhoneDto extends BulkSimIdentifiersDto {}

export class BulkLockSimsByPhoneDto extends BulkSimIdentifiersDto {}

export class BulkPendingCancelSimsByPhoneDto extends BulkSimIdentifiersDto {}

export class BulkPendingLockSimsByPhoneDto extends BulkSimIdentifiersDto {}

export class BulkPendingRevokeSimsByPhoneDto extends BulkSimIdentifiersDto {}
