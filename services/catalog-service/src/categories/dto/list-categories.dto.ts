import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class ListCategoriesDto {
  /** `?rootOnly=true` chi tra ve danh muc goc (khong co cha). */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  rootOnly?: boolean;
}
