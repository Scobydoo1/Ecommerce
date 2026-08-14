'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'idle' | 'sending' | 'added' | 'error';

export function AddToCartButton({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const soldOut = stock <= 0;

  async function addToCart() {
    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        setStatus('error');
        setMessage(body.message ?? 'Không thêm được vào giỏ. Thử lại nhé.');
        return;
      }

      setStatus('added');
      router.refresh();
    } catch {
      setStatus('error');
      setMessage('Không kết nối được tới giỏ hàng. Thử lại nhé.');
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={addToCart}
        disabled={soldOut || status === 'sending'}
        className="w-full rounded-md bg-jade px-8 py-3.5 font-medium text-white transition-colors hover:bg-jade-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-muted sm:w-auto"
      >
        {soldOut ? 'Hết hàng' : status === 'sending' ? 'Đang thêm…' : 'Thêm vào giỏ'}
      </button>

      {/* `aria-live` de trinh doc man hinh doc ket qua ma khong can di chuyen focus. */}
      <p aria-live="polite" className="mt-3 text-sm">
        {status === 'added' && (
          <span className="text-jade-deep">
            Đã thêm vào giỏ.{' '}
            <a href="/cart" className="underline underline-offset-4">
              Xem giỏ hàng
            </a>
          </span>
        )}
        {status === 'error' && <span className="text-clay">{message}</span>}
      </p>
    </div>
  );
}
