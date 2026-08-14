'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CheckoutResult } from '@ecommerce/types';

export function CheckoutForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError('');

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = (await response?.json().catch(() => ({}))) as { message?: string };
      setError(body?.message ?? 'Không tạo được đơn hàng. Thử lại nhé.');
      setSending(false);
      return;
    }

    const result = (await response.json()) as CheckoutResult;
    router.push(`/orders/${result.order.orderNumber}`);
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-md">
      <label htmlFor="checkout-email" className="block text-sm font-medium text-ink">
        Email nhận xác nhận đơn
      </label>
      <input
        id="checkout-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="ban@example.com"
        className="mt-2 h-12 w-full rounded-md border border-line bg-white px-4 focus:border-jade"
      />

      <button
        type="submit"
        disabled={sending}
        className="mt-6 w-full rounded-md bg-jade px-6 py-3.5 font-medium text-white hover:bg-jade-deep disabled:bg-line disabled:text-muted"
      >
        {sending ? 'Đang tạo đơn…' : 'Đặt hàng'}
      </button>

      <p aria-live="polite" className="mt-3 text-sm text-clay">
        {error}
      </p>
    </form>
  );
}
