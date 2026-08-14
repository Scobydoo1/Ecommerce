import { Type } from 'class-transformer';
import { IsInt, IsString, IsUUID, Max, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;
}

export class SetQuantityDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(999)
  quantity!: number;
}

export class SessionHeaderDto {
  @IsString()
  sessionId!: string;
}
