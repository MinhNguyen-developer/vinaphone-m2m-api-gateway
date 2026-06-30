import { IsArray, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SimStatus } from '../../types/common';

export enum SimStatusAction {
  CONFIRM = 'confirm',
  RESET = 'reset',
  CANCEL = 'cancel',
  LOCK = 'lock',
  PENDING_CANCEL = 'pending_cancel',
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
    description: 'Danh sách số điện thoại cần hủy',
  })
  @IsArray()
  @IsString({ each: true })
  phoneNumbers!: string[];
}

export class BulkResetSimsByPhoneDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách số điện thoại cần reset',
  })
  @IsArray()
  @IsString({ each: true })
  phoneNumbers!: string[];
}

export class BulkLockSimsByPhoneDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách số điện thoại cần tạm khoá',
  })
  @IsArray()
  @IsString({ each: true })
  phoneNumbers!: string[];
}

export class BulkPendingCancelSimsByPhoneDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách số điện thoại chờ huỷ',
  })
  @IsArray()
  @IsString({ each: true })
  phoneNumbers!: string[];
}
