'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name: form.get('name') }),
    }).catch(() => null);

    if (!response || !response.ok) {
      const body = (await response?.json().catch(() => ({}))) as { message?: string };
      setError(body?.message ?? 'Không tạo được tài khoản');
      setSending(false);
      return;
    }

    // Dang ky xong thi dang nhap luon, khach khong phai go lai mat khau.
    await signIn('credentials', { email, password, redirect: false });
    setSending(false);
    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-sm">
      <label htmlFor="register-name" className="block text-sm font-medium text-ink">
        Tên <span className="font-normal text-muted">(không bắt buộc)</span>
      </label>
      <input
        id="register-name"
        name="name"
        type="text"
        autoComplete="name"
        className="mt-2 h-12 w-full rounded-md border border-line bg-white px-4 focus:border-jade"
      />

      <label htmlFor="register-email" className="mt-5 block text-sm font-medium text-ink">
        Email
      </label>
      <input
        id="register-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="mt-2 h-12 w-full rounded-md border border-line bg-white px-4 focus:border-jade"
      />

      <label htmlFor="register-password" className="mt-5 block text-sm font-medium text-ink">
        Mật khẩu
      </label>
      <input
        id="register-password"
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        className="mt-2 h-12 w-full rounded-md border border-line bg-white px-4 focus:border-jade"
      />
      <p className="mt-1.5 text-xs text-muted">Ít nhất 8 ký tự.</p>

      <button
        type="submit"
        disabled={sending}
        className="mt-6 w-full rounded-md bg-jade px-6 py-3.5 font-medium text-white hover:bg-jade-deep disabled:bg-line disabled:text-muted"
      >
        {sending ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
      </button>

      <p aria-live="polite" className="mt-3 text-sm text-clay">
        {error}
      </p>
    </form>
  );
}
