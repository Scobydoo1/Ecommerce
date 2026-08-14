import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="shell py-16">
      <h1 className="font-display text-3xl font-semibold text-ink">Đăng nhập</h1>
      <p className="mt-2 text-sm text-muted">
        Chưa có tài khoản?{' '}
        <Link href="/register" className="text-jade-deep underline underline-offset-4">
          Tạo tài khoản mới
        </Link>
      </p>

      <LoginForm />
    </div>
  );
}
