import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { catalogApi } from '@/lib/api-client';
import { ProductCard } from '@/components/product-card/ProductCard';

export const dynamic = 'force-dynamic';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await catalogApi.getCategoryBySlug(params.slug);
  if (!category) return { title: 'Không tìm thấy danh mục' };

  return {
    title: category.name,
    description: `Sản phẩm thuộc danh mục ${category.name}.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await catalogApi.getCategoryBySlug(params.slug);
  if (!category) notFound();

  const products = await catalogApi.listProducts({
    categoryId: category.id,
    status: 'ACTIVE',
    limit: 24,
  });

  return (
    <div className="shell py-12">
      <nav aria-label="Đường dẫn" className="text-sm text-muted">
        <Link href="/" className="hover:text-jade-deep">
          Trang chủ
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink">{category.name}</span>
      </nav>

      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">{category.name}</h1>
      <p className="mt-2 text-sm text-muted">
        {products.total} sản phẩm
      </p>

      {products.items.length === 0 ? (
        <p className="mt-10 text-sm text-muted">Danh mục này chưa có sản phẩm nào.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
          {products.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
