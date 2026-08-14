'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    });

    setSending(false);

    if (result?.error) {
      // Khong noi ro sai email hay sai mat khau - do la thong tin cho ke do email.
      setError('Email hoặc mật khẩu không đúng');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 max-w-sm">
      <label htmlFor="login-email" className="block text-sm font-medium text-ink">
        Email
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="mt-2 h-12 w-full rounded-md border border-line bg-white px-4 focus:border-jade"
      />

      <label htmlFor="login-password" className="mt-5 block text-sm font-medium text-ink">
        Mật khẩu
      </label>
      <input
        id="login-password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        className="mt-2 h-12 w-full rounded-md border border-line bg-white px-4 focus:border-jade"
      />

      <button
        type="submit"
        disabled={sending}
        className="mt-6 w-full rounded-md bg-jade px-6 py-3.5 font-medium text-white hover:bg-jade-deep disabled:bg-line disabled:text-muted"
      >
        {sending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>

      <p aria-live="polite" className="mt-3 text-sm text-clay">
        {error}
      </p>
    </form>
  );
}
