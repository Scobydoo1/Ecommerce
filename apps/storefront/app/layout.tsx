import type { Metadata } from 'next';
import Link from 'next/link';
import { Be_Vietnam_Pro, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';

/**
 * Be Vietnam Pro duoc thiet ke rieng cho dau tieng Viet: cac dau chong nhau
 * (mu + thanh) khong bi cham nhau nhu o phan lon font Latin. Day la ly do
 * chon no lam font than, khong phai vi thi hieu.
 */
const body = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const display = Bricolage_Grotesque({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Chợ Ngọc — tìm đúng thứ bạn cần, kể cả khi gõ sai',
    template: '%s · Chợ Ngọc',
  },
  description:
    'Cửa hàng trực tuyến với công cụ tìm kiếm bỏ qua lỗi chính tả và dấu tiếng Việt.',
};

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="shell flex h-16 items-center gap-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-jade-deep">
          Chợ Ngọc
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-muted sm:flex">
          <Link href="/" className="hover:text-ink">
            Trang chủ
          </Link>
        </nav>

        <form action="/search" className="ml-auto flex w-full max-w-xs items-center">
          <label htmlFor="header-search" className="sr-only">
            Tìm sản phẩm
          </label>
          <input
            id="header-search"
            type="search"
            name="q"
            placeholder="Tìm sản phẩm…"
            className="h-10 w-full rounded-l-md border border-line bg-mist px-3 text-sm placeholder:text-muted focus:border-jade"
          />
          <button
            type="submit"
            className="h-10 shrink-0 rounded-r-md bg-jade px-4 text-sm font-medium text-white hover:bg-jade-deep"
          >
            Tìm
          </button>
        </form>

        <Link
          href="/cart"
          className="shrink-0 text-sm font-medium text-ink hover:text-jade-deep"
        >
          Giỏ hàng
        </Link>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-mist">
      <div className="shell flex flex-col gap-2 py-10 text-sm text-muted">
        <p className="font-display text-base text-jade-deep">Chợ Ngọc</p>
        <p>Bản dựng Phase 1 — storefront và tìm kiếm thông minh.</p>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${body.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
