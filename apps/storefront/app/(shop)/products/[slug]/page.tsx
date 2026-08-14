import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { catalogApi } from '@/lib/api-client';
import { formatMoney } from '@/lib/formatMoney';
import { AddToCartButton } from '@/components/product-detail/AddToCartButton';

export const dynamic = 'force-dynamic';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await catalogApi.getProductBySlug(params.slug);
  if (!product) return { title: 'Không tìm thấy sản phẩm' };

  const description = product.description?.slice(0, 160) ?? `${product.name} tại Chợ Ngọc.`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: 'website',
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await catalogApi.getProductBySlug(params.slug);
  if (!product) notFound();

  const gallery = product.images.length > 0 ? product.images : null;
  const soldOut = product.stock <= 0;

  return (
    <div className="shell py-12">
      <nav aria-label="Đường dẫn" className="text-sm text-muted">
        <Link href="/" className="hover:text-jade-deep">
          Trang chủ
        </Link>
        {product.category && (
          <>
            <span className="px-2">/</span>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-jade-deep">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-mist">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                priority
                sizes="(min-width: 1024px) 36rem, 90vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-6xl text-line">
                {product.name.slice(0, 1)}
              </div>
            )}
          </div>

          {gallery && gallery.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-3">
              {gallery.slice(0, 4).map((image) => (
                <li key={image.url} className="relative aspect-square overflow-hidden rounded bg-mist">
                  <Image
                    src={image.url}
                    alt={image.alt ?? ''}
                    fill
                    sizes="8rem"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">{product.sku}</p>

          <p className="price-tag mt-6 inline-block bg-gold px-4 py-2 font-display text-2xl font-semibold text-ink">
            {formatMoney(product.price)}
          </p>

          <p className="mt-4 text-sm">
            {soldOut ? (
              <span className="text-clay">Tạm hết hàng</span>
            ) : (
              <span className="text-muted">Còn {product.stock} sản phẩm</span>
            )}
          </p>

          {product.description && (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Mô tả</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink">
                {product.description}
              </p>
            </div>
          )}

          <AddToCartButton productId={product.id} stock={product.stock} />
        </div>
      </div>
    </div>
  );
}
