import type { Metadata } from 'next';
import Link from 'next/link';
import { catalogApi } from '@/lib/api-client';
import { ProductCard } from '@/components/product-card/ProductCard';
import { SearchBar } from '@/components/search-bar/SearchBar';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

type Props = { searchParams: { q?: string; page?: string } };

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q?.trim() ?? '';
  return {
    title: q ? `Tìm "${q}"` : 'Tìm kiếm',
    // Trang ket qua khong co gia tri cho cong cu tim kiem lap chi muc.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q?.trim() ?? '';
  const page = Math.max(1, Number(searchParams.page) || 1);

  if (q === '') {
    return (
      <div className="shell py-12">
        <h1 className="font-display text-3xl font-semibold text-ink">Tìm sản phẩm</h1>
        <div className="mt-6">
          <SearchBar variant="hero" />
        </div>
      </div>
    );
  }

  const results = await catalogApi.search({
    q,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const lastPage = Math.max(1, Math.ceil(results.total / PAGE_SIZE));
  const normalizedDiffers = results.normalizedQuery !== results.query.trim().toLowerCase();

  return (
    <div className="shell py-12">
      <div className="max-w-2xl">
        <SearchBar variant="hero" initialQuery={q} />
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {results.total} kết quả cho “{results.query}”
        </h1>

        {normalizedDiffers && (
          <p className="text-sm text-muted">
            bạn gõ <code className="font-mono text-ink">{results.query}</code>
            <span className="px-1.5">·</span>
            tìm theo <code className="font-mono text-jade-deep">{results.normalizedQuery}</code>
          </p>
        )}
      </div>

      {results.items.length === 0 ? (
        <div className="mt-12 max-w-md">
          <p className="text-ink">Không có sản phẩm nào khớp.</p>
          <p className="mt-2 text-sm text-muted">
            Thử bớt một vài từ, hoặc{' '}
            <Link href="/" className="text-jade-deep underline underline-offset-4">
              xem hàng mới về
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
            {results.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {lastPage > 1 && (
            <nav aria-label="Phân trang" className="mt-12 flex items-center gap-4 text-sm">
              {page > 1 && (
                <Link
                  href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}`}
                  className="rounded-md border border-line px-4 py-2 hover:border-jade hover:text-jade-deep"
                >
                  Trang trước
                </Link>
              )}
              <span className="text-muted">
                Trang {page} / {lastPage}
              </span>
              {page < lastPage && (
                <Link
                  href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}`}
                  className="rounded-md border border-line px-4 py-2 hover:border-jade hover:text-jade-deep"
                >
                  Trang sau
                </Link>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
