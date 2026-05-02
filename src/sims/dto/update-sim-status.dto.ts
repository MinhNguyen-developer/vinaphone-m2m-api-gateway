import { IsArray, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SimStatusAction {
  CONFIRM = 'confirm',
  RESET = 'reset',
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
