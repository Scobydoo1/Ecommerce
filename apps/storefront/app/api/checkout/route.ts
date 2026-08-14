import { NextResponse } from 'next/server';
import { ApiError, orderApi } from '@/lib/api-client';
import { getCartSession } from '@/lib/cartSession';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const sessionId = getCartSession();
  if (!sessionId) {
    return NextResponse.json({ message: 'Phiên giỏ hàng chưa sẵn sàng' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  if (!body.email) {
    return NextResponse.json({ message: 'Cần email để gửi xác nhận đơn' }, { status: 400 });
  }

  // Khach dang nhap thi gan don vao tai khoan; khach vang lai van dat duoc.
  const session = await auth();

  try {
    return NextResponse.json(
      await orderApi.checkout(sessionId, body.email, session?.user?.id),
    );
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: 'Không tạo được đơn hàng' }, { status: 502 });
  }
}
