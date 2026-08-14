import bcrypt from 'bcryptjs';

/**
 * 12 vong: cham du de lam kho do vet can, nhanh du de dang nhap khong thay lag.
 * bcryptjs (thuan JS) thay vi bcrypt native - khong can toolchain bien dich
 * tren may Windows va trong CI.
 */
const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // Tai khoan chua dat mat khau (hash rong) khong duoc phep nem loi va lam vo
  // ca luong dang nhap - chi don gian la khong khop.
  if (!hash) return false;

  return bcrypt.compare(plain, hash);
}
