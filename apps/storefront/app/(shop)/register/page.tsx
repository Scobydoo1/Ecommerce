import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Tạo tài khoản',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <div className="shell py-16">
      <h1 className="font-display text-3xl font-semibold text-ink">Tạo tài khoản</h1>
      <p className="mt-2 text-sm text-muted">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-jade-deep underline underline-offset-4">
          Đăng nhập
        </Link>
      </p>

      <RegisterForm />
    </div>
  );
}
