/** Moi so tien deu la integer cents, khong bao gio dung float. */
export interface Money {
  amountCents: number;
  currency: string;
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface ProductImageDto {
  url: string;
  alt: string | null;
  position: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  slug: string;
  price: Money;
  stock: number;
  status: ProductStatus;
  imageUrl: string | null;
  categoryId: string | null;
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  images: ProductImageDto[];
  category: CategorySummary | null;
}

export interface Paginated<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}
