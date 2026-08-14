import Image from 'next/image';
import Link from 'next/link';
import type { ProductSummary } from '@ecommerce/types';
import { formatMoney } from '@/lib/formatMoney';

export function ProductCard({ product }: { product: ProductSummary }) {
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block focus-visible:ring-offset-4"
      aria-label={product.name}
    >
      <article className="flex h-full flex-col">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-mist">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl text-line">
              {product.name.slice(0, 1)}
            </div>
          )}

          {soldOut && (
            <span className="absolute left-3 top-3 rounded bg-ink/85 px-2 py-1 text-xs font-medium text-white">
              Hết hàng
            </span>
          )}

          {/* The gia khia goc - neo o goc duoi phai cua anh. */}
          <span className="price-tag absolute bottom-0 right-0 bg-gold px-3 py-1.5 font-display text-sm font-semibold text-ink">
            {formatMoney(product.price)}
          </span>
        </div>

        <h3 className="mt-3 text-sm font-medium leading-snug text-ink group-hover:text-jade-deep">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-muted">{product.sku}</p>
      </article>
    </Link>
  );
}
