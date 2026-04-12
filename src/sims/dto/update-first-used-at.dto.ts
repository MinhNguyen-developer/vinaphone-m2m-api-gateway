import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFirstUsedAtDto {
  @ApiProperty({ example: '2025-03-01 08:00', description: 'Format: YYYY-MM-DD HH:mm' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, {
    message: 'firstUsedAt must be in format YYYY-MM-DD HH:mm',
  })
  firstUsedAt: string;
}
