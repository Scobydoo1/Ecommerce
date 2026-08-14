import { NextResponse } from 'next/server';
import { ApiError, orderApi } from '@/lib/api-client';
import { getCartSession } from '@/lib/cartSession';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const sessionId = getCartSession();
  if (!sessionId) {
    return NextResponse.json({ message: 'Phiên giỏ hàng chưa sẵn sàng. Tải lại trang nhé.' }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    productId?: string;
    quantity?: number;
  };

  if (!body.productId) {
    return NextResponse.json({ message: 'Thiếu mã sản phẩm' }, { status: 400 });
  }

  try {
    return NextResponse.json(await orderApi.addItem(sessionId, body.productId, body.quantity ?? 1));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: 'Không kết nối được tới giỏ hàng' }, { status: 502 });
  }
}
