import { Prisma } from '@prisma/client';
import type { Category, Product, ProductImage } from '@prisma/client';
import type { ProductDetail, ProductImageDto, ProductSummary } from '@ecommerce/types';

export const PRODUCT_INCLUDE = {
  images: true,
  category: true,
} satisfies Prisma.ProductInclude;

export type ProductWithRelations = Product & {
  images: ProductImage[];
  category: Category | null;
};

/** Sap xep anh theo `position` ngay tai mapper de thu tu khong phu thuoc query. */
function sortedImages(images: ProductImage[]): ProductImageDto[] {
  return [...images]
    .sort((a, b) => a.position - b.position)
    .map((image) => ({ url: image.url, alt: image.alt, position: image.position }));
}

export function toProductSummary(product: ProductWithRelations): ProductSummary {
  const images = sortedImages(product.images ?? []);

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    price: { amountCents: product.priceCents, currency: product.currency },
    stock: product.stock,
    status: product.status,
    imageUrl: images[0]?.url ?? null,
    categoryId: product.categoryId,
  };
}

export function toProductDetail(product: ProductWithRelations): ProductDetail {
  return {
    ...toProductSummary(product),
    description: product.description,
    images: sortedImages(product.images ?? []),
    category: product.category
      ? { id: product.category.id, name: product.category.name, slug: product.category.slug }
      : null,
  };
}
