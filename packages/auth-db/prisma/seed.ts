import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

/**
 * Tai khoan demo cho moi truong dev.
 *
 * Mat khau nam trong ma nguon la CO Y va chi dung cho seed cuc bo - day khong
 * phai bi mat. Khong bao gio chay seed nay tren production.
 */
const DEMO_USERS = [
  { email: 'demo@chongoc.vn', name: 'Khách Demo', password: 'demo12345' },
  { email: 'an.nguyen@chongoc.vn', name: 'Nguyễn Văn An', password: 'demo12345' },
  { email: 'binh.tran@chongoc.vn', name: 'Trần Thị Bình', password: 'demo12345' },
];

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Khong chay seed tai khoan demo tren production');
  }

  for (const user of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, passwordHash },
      create: { email: user.email, name: user.name, passwordHash },
    });
  }

  console.warn(
    `Seed xong: ${DEMO_USERS.length} tai khoan demo. ` +
      `Dang nhap thu: demo@chongoc.vn / demo12345`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
