import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  /** Tran cung do SearchService ap dat, khong dat @Max o day. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class SuggestQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
