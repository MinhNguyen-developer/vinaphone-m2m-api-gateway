import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SimStatusAction {
  CONFIRM = 'confirm',
  RESET = 'reset',
}

export class UpdateSimStatusDto {
  @ApiProperty({ enum: SimStatusAction })
  @IsEnum(SimStatusAction)
  action: SimStatusAction;
}
