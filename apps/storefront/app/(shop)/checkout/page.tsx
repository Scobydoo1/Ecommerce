import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { CartView } from '@ecommerce/types';
import { orderApi } from '@/lib/api-client';
import { getCartSession } from '@/lib/cartSession';
import { formatMoney } from '@/lib/formatMoney';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Thanh toán',
  robots: { index: false, follow: false },
};

const EMPTY_CART: CartView = {
  items: [],
  subtotal: { amountCents: 0, currency: 'VND' },
  itemCount: 0,
};

export default async function CheckoutPage() {
  const sessionId = getCartSession();
  const cart = sessionId ? await orderApi.getCart(sessionId).catch(() => EMPTY_CART) : EMPTY_CART;

  if (cart.items.length === 0) redirect('/cart');

  return (
    <div className="shell py-12">
      <nav aria-label="Đường dẫn" className="text-sm text-muted">
        <Link href="/cart" className="hover:text-jade-deep">
          Giỏ hàng
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">Thanh toán</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">Thanh toán</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <CheckoutForm />

        <aside className="h-fit rounded-lg border border-line bg-mist p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Đơn của bạn</h2>

          <ul className="mt-4 space-y-3 text-sm">
            {cart.items.map((line) => (
              <li key={line.productId} className="flex justify-between gap-4">
                <span className="min-w-0 text-muted">
                  {line.name} <span className="text-ink">× {line.quantity}</span>
                </span>
                <span className="shrink-0 tabular-nums">{formatMoney(line.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t border-line pt-3 text-base font-semibold">
            <span>Tổng cộng</span>
            <span className="tabular-nums">{formatMoney(cart.subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
