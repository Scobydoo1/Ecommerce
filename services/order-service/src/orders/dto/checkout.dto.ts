import { IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CheckoutDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email!: string;

  /** Co khi khach da dang nhap; don khong bat buoc gan voi tai khoan. */
  @IsOptional()
  @IsUUID()
  userId?: string;
}
