import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryTriggeredDto {
  @ApiPropertyOptional({ description: 'Lọc theo nhóm thiết bị (UUID)' })
  @IsOptional()
  @IsUUID('4')
  groupId?: string;

  @ApiPropertyOptional({
    description: 'Sắp xếp, ví dụ: usedMB:asc | usedMB:desc',
  })
  @IsOptional()
  @IsString()
  sort?: string;
}
