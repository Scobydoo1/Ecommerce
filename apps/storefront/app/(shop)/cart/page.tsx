import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import type { CartView } from '@ecommerce/types';
import { orderApi } from '@/lib/api-client';
import { getCartSession } from '@/lib/cartSession';
import { formatMoney } from '@/lib/formatMoney';
import { CartLineControls } from '@/components/cart/CartLineControls';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Giỏ hàng',
  robots: { index: false, follow: false },
};

const EMPTY_CART: CartView = {
  items: [],
  subtotal: { amountCents: 0, currency: 'VND' },
  itemCount: 0,
};

export default async function CartPage() {
  const sessionId = getCartSession();
  const cart = sessionId ? await orderApi.getCart(sessionId).catch(() => EMPTY_CART) : EMPTY_CART;

  if (cart.items.length === 0) {
    return (
      <div className="shell py-16">
        <h1 className="font-display text-3xl font-semibold text-ink">Giỏ hàng trống</h1>
        <p className="mt-3 text-muted">Chưa có gì trong giỏ.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-md bg-jade px-6 py-3 font-medium text-white hover:bg-jade-deep"
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="shell py-12">
      <h1 className="font-display text-3xl font-semibold text-ink">Giỏ hàng</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((line) => (
            <li key={line.productId} className="flex gap-4 py-5">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded bg-mist">
                {line.imageUrl && (
                  <Image src={line.imageUrl} alt="" fill sizes="5rem" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${line.slug}`}
                  className="text-sm font-medium text-ink hover:text-jade-deep"
                >
                  {line.name}
                </Link>
                <p className="mt-1 text-sm text-muted">{formatMoney(line.unitPrice)}</p>

                <CartLineControls
                  productId={line.productId}
                  quantity={line.quantity}
                  stock={line.stock}
                />
              </div>

              <p className="shrink-0 text-sm font-medium tabular-nums text-ink">
                {formatMoney(line.lineTotal)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-lg border border-line bg-mist p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Tóm tắt</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Tạm tính ({cart.itemCount} món)</dt>
              <dd className="tabular-nums text-ink">{formatMoney(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
              <dt>Tổng cộng</dt>
              <dd className="tabular-nums">{formatMoney(cart.subtotal)}</dd>
            </div>
          </dl>

          <Link
            href="/checkout"
            className="mt-6 block rounded-md bg-jade px-6 py-3 text-center font-medium text-white hover:bg-jade-deep"
          >
            Thanh toán
          </Link>
        </aside>
      </div>
    </div>
  );
}
