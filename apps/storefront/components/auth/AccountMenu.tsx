import Link from 'next/link';
import { auth, signOut } from '@/lib/auth';

export async function AccountMenu() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link href="/login" className="shrink-0 text-sm font-medium text-ink hover:text-jade-deep">
        Đăng nhập
      </Link>
    );
  }

  return (
    <form
      action={async () => {
        'use server';
        await signOut({ redirectTo: '/' });
      }}
      className="shrink-0"
    >
      <button type="submit" className="text-sm font-medium text-ink hover:text-jade-deep">
        Đăng xuất
      </button>
    </form>
  );
}
