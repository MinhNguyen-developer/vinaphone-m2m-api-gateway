import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChatDto {
  @ApiProperty({ description: "The user's question", minLength: 1 })
  @IsString()
  @MinLength(1)
  message: string;

  @ApiPropertyOptional({
    description:
      'Existing session ID for multi-turn conversation. Omit to start a new session.',
  })
  @IsOptional()
  @IsString()
  session_id?: string;
}
