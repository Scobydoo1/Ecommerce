import { NextResponse } from 'next/server';
import { ApiError, orderApi } from '@/lib/api-client';
import { getCartSession } from '@/lib/cartSession';

export const dynamic = 'force-dynamic';

type Context = { params: { productId: string } };

async function setQuantity(productId: string, quantity: number) {
  const sessionId = getCartSession();
  if (!sessionId) {
    return NextResponse.json({ message: 'Phiên giỏ hàng chưa sẵn sàng' }, { status: 400 });
  }

  try {
    return NextResponse.json(await orderApi.setQuantity(sessionId, productId, quantity));
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: 'Không cập nhật được giỏ hàng' }, { status: 502 });
  }
}

export async function PUT(request: Request, { params }: Context) {
  const body = (await request.json().catch(() => ({}))) as { quantity?: number };
  return setQuantity(params.productId, body.quantity ?? 0);
}

export async function DELETE(_request: Request, { params }: Context) {
  return setQuantity(params.productId, 0);
}
