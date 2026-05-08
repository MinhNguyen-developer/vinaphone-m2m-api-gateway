import { IsArray, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SimStatusAction {
  CONFIRM = 'confirm',
  RESET = 'reset',
  CANCEL = 'cancel',
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

  @ApiProperty({ enum: SimStatusAction })
  @IsEnum(SimStatusAction)
  action!: SimStatusAction;
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
