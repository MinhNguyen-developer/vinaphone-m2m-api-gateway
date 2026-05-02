import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateGroupDto {
  @ApiPropertyOptional({ description: 'Tên nhóm', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Mô tả nhóm' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [String], description: 'Danh sách SIM ID trong nhóm (ghi đè toàn bộ)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  simIds?: string[];
}
