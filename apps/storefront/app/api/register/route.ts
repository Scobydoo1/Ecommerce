import { NextResponse } from 'next/server';
import { prisma } from '@ecommerce/auth-db';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    name?: string;
  };

  const email = body.email?.trim().toLowerCase() ?? '';
  const password = body.password ?? '';

  if (!email.includes('@')) {
    return NextResponse.json({ message: 'Email không hợp lệ' }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { message: `Mật khẩu cần ít nhất ${MIN_PASSWORD_LENGTH} ký tự` },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: 'Email này đã được đăng ký' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: body.name?.trim() || null,
      passwordHash: await hashPassword(password),
    },
  });

  // Khong tra ve email trong body: log truy cap khong duoc chua PII.
  return NextResponse.json({ id: user.id }, { status: 201 });
}
