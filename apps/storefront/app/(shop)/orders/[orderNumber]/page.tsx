import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError, orderApi } from '@/lib/api-client';
import { getCartSession } from '@/lib/cartSession';
import { formatMoney } from '@/lib/formatMoney';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Xác nhận đơn hàng',
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  CANCELLED: 'Đã huỷ',
};

type Props = { params: { orderNumber: string } };

export default async function OrderConfirmationPage({ params }: Props) {
  const sessionId = getCartSession();

  const order = await orderApi.getOrder(sessionId, params.orderNumber).catch((error) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });

  if (!order) notFound();

  return (
    <div className="shell py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-jade">Đã nhận đơn</p>

      <h1 className="mt-4 font-display text-4xl font-semibold text-jade-deep">
        Cảm ơn bạn đã đặt hàng
      </h1>

      <p className="mt-4 text-muted">
        Mã đơn <span className="font-mono text-ink">{order.orderNumber}</span>
        <span className="px-2">·</span>
        {STATUS_LABEL[order.status] ?? order.status}
      </p>

      {order.email && (
        <p className="mt-1 text-sm text-muted">Xác nhận sẽ gửi tới {order.email}.</p>
      )}

      <div className="mt-10 max-w-2xl rounded-lg border border-line">
        <ul className="divide-y divide-line">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-baseline justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{item.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  {item.sku} · {formatMoney(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm tabular-nums text-ink">{formatMoney(item.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-line px-5 py-4 text-base font-semibold">
          <span>Tổng cộng</span>
          <span className="tabular-nums">{formatMoney(order.total)}</span>
        </div>
      </div>

      <Link
        href="/"
        className="mt-10 inline-block rounded-md border border-line px-6 py-3 text-sm hover:border-jade hover:text-jade-deep"
      >
        Tiếp tục mua sắm
      </Link>
    </div>
  );
}
