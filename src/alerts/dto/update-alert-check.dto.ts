import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAlertCheckDto {
  @ApiProperty()
  @IsBoolean()
  checked: boolean;
}
