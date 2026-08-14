'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Props = { productId: string; quantity: number; stock: number };

export function CartLineControls({ productId, quantity, stock }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function setQuantity(next: number) {
    setBusy(true);
    setError('');

    const response = await fetch(`/api/cart/items/${productId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ quantity: next }),
    }).catch(() => null);

    setBusy(false);

    if (!response || !response.ok) {
      const body = (await response?.json().catch(() => ({}))) as { message?: string };
      setError(body?.message ?? 'Không cập nhật được');
      return;
    }

    startTransition(() => router.refresh());
  }

  const disabled = busy || pending;

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setQuantity(quantity - 1)}
          disabled={disabled}
          aria-label="Giảm một"
          className="h-8 w-8 rounded border border-line text-ink hover:border-jade disabled:opacity-40"
        >
          −
        </button>

        <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
          {quantity}
        </span>

        <button
          type="button"
          onClick={() => setQuantity(quantity + 1)}
          disabled={disabled || quantity >= stock}
          aria-label="Tăng một"
          className="h-8 w-8 rounded border border-line text-ink hover:border-jade disabled:opacity-40"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => setQuantity(0)}
          disabled={disabled}
          className="ml-3 text-sm text-muted underline underline-offset-4 hover:text-clay disabled:opacity-40"
        >
          Xoá
        </button>
      </div>

      {quantity >= stock && <p className="mt-1 text-xs text-muted">Đã lấy hết số còn trong kho.</p>}
      {error && <p className="mt-1 text-xs text-clay">{error}</p>}
    </div>
  );
}
