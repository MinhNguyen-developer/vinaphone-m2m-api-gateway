import {
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';

export class PatchSimDto {
  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  usedMB?: number;

  @IsOptional()
  @IsDateString()
  firstUsedAt?: string | null;

  @IsOptional()
  @IsString()
  simCodeLabel?: string | null;

  @IsOptional()
  @IsInt()
  status?: number;
}
