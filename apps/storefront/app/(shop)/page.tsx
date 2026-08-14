import Link from 'next/link';
import { catalogApi } from '@/lib/api-client';
import { ProductCard } from '@/components/product-card/ProductCard';
import { SearchBar } from '@/components/search-bar/SearchBar';

export const dynamic = 'force-dynamic';

/**
 * Ba vi du deu co loi that: thieu dau, go thua chu, va sai phu am.
 * Chung la ban demo song cua thu duy nhat khien trang nay khac cho khac.
 */
const TYPO_EXAMPLES = ['ao thunn', 'dong ho', 'tai nge'];

export default async function HomePage() {
  const [newest, categories] = await Promise.all([
    catalogApi.listProducts({ status: 'ACTIVE', limit: 8 }),
    catalogApi.listCategories({ rootOnly: true }),
  ]);

  return (
    <>
      <section className="border-b border-line bg-jade-wash">
        <div className="shell py-16 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-jade">
            Tìm kiếm bỏ qua lỗi gõ
          </p>

          <h1 className="mt-4 max-w-3xl font-display text-display font-semibold text-jade-deep">
            Gõ sai vẫn ra đúng.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            Thiếu dấu, thừa chữ, nhầm phụ âm — bạn cứ gõ như đang nói. Chúng tôi lo phần
            còn lại.
          </p>

          <div className="mt-8">
            <SearchBar variant="hero" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">Thử gõ sai xem:</span>
            {TYPO_EXAMPLES.map((example) => (
              <Link
                key={example}
                href={`/search?q=${encodeURIComponent(example)}`}
                className="rounded-full border border-jade/25 bg-white px-3 py-1 font-mono text-xs text-jade-deep transition-colors hover:border-jade hover:bg-jade hover:text-white"
              >
                {example}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="shell pt-12">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="rounded-md border border-line px-4 py-2 text-sm text-ink transition-colors hover:border-jade hover:text-jade-deep"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="shell pt-12">
        <h2 className="font-display text-2xl font-semibold text-ink">Mới về</h2>

        {newest.items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Chưa có sản phẩm nào. Chạy <code className="font-mono">pnpm --filter catalog-service seed</code> để
            nạp dữ liệu mẫu.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
            {newest.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
