import type { ProductSummary } from './product';

export interface SearchResponse {
  /** Chuoi nguoi dung go vao, giu nguyen. */
  query: string;
  /** Chuoi sau khi chuan hoa: bo dau, lowercase, gop khoang trang. */
  normalizedQuery: string;
  total: number;
  limit: number;
  offset: number;
  items: ProductSummary[];
}

export interface SuggestItem {
  name: string;
  slug: string;
}

export interface SuggestResponse {
  query: string;
  items: SuggestItem[];
}
