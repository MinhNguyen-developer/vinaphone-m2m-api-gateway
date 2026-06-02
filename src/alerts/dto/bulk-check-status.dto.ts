import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkCheckStatusDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách UUID của AlertConfig cần đánh dấu Đã kiểm tra',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];
}
