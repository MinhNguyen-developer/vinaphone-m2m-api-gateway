import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkCheckDto {
  @ApiProperty({
    type: [String],
    description: 'Danh sách số điện thoại cần đánh dấu đã kiểm tra',
  })
  @IsArray()
  @IsString({ each: true })
  phoneNumbers!: string[];
}
