import { PrismaClient } from '../generated/prisma';

export type { User } from '../generated/prisma';

/**
 * Truy cap schema `auth` nam trong package rieng chu khong trong apps/storefront.
 *
 * Ly do: Prisma client sinh ra ben trong thu muc app khien webpack cua Next di
 * quet tim query engine va dam vao thu muc home cua nguoi dung
 * (`C:\Users\<ten>\Cookies` nem EPERM tren Windows). Nam o package rieng da
 * bien dich san, Next chi `require` no nhu mot goi thuong.
 */
const globalForPrisma = globalThis as unknown as { authPrisma?: PrismaClient };

export const prisma = globalForPrisma.authPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.authPrisma = prisma;
}
