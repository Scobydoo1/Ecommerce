import type {
  CartView,
  CategorySummary,
  CheckoutResult,
  OrderView,
  Paginated,
  ProductDetail,
  ProductSummary,
  SearchResponse,
  SuggestResponse,
} from '@ecommerce/types';

const CATALOG_BASE = process.env.NEXT_PUBLIC_CATALOG_API_URL ?? 'http://localhost:3001';
const ORDER_BASE = process.env.NEXT_PUBLIC_ORDER_API_URL ?? 'http://localhost:3002';

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Ghep URL cho service. Bo tham so undefined/null/chuoi rong nhung GIU LAI
 * so 0 va false - `offset=0` la gia tri that, khong phai "khong co gia tri".
 */
export function buildUrl(base: string, path: string, params: QueryParams = {}): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return `${base.replace(/\/$/, '')}${path}${query ? `?${query}` : ''}`;
}

/**
 * Moi lan doc deu goi thang service, khong cache.
 *
 * Ly do khong dung ISR: ton kho va gia doi theo tung don hang, ban mot trang
 * cu 60 giay la ban vuot kho. Ngoai ra ISR bat `next build` phai prerender,
 * tuc la CI cung phai dung day du backend chi de build duoc frontend.
 * Trang van la SSR nen SEO khong mat gi.
 */
async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ApiError(response.status, url, `${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

/** Tra ve `null` khi 404 de trang goi duoc `notFound()` thay vi vo mot loi 500. */
async function getJsonOrNull<T>(url: string): Promise<T | null> {
  try {
    return await getJson<T>(url);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export const catalogApi = {
  listProducts(params: {
    limit?: number;
    offset?: number;
    categoryId?: string;
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  }): Promise<Paginated<ProductSummary>> {
    return getJson(buildUrl(CATALOG_BASE, '/products', { ...params }));
  },

  getProductBySlug(slug: string): Promise<ProductDetail | null> {
    return getJsonOrNull(buildUrl(CATALOG_BASE, `/products/slug/${encodeURIComponent(slug)}`));
  },

  listCategories(params: { rootOnly?: boolean } = {}): Promise<CategorySummary[]> {
    return getJson(buildUrl(CATALOG_BASE, '/categories', { ...params }));
  },

  getCategoryBySlug(slug: string): Promise<CategorySummary | null> {
    return getJsonOrNull(buildUrl(CATALOG_BASE, `/categories/slug/${encodeURIComponent(slug)}`));
  },

  search(params: {
    q: string;
    limit?: number;
    offset?: number;
    categoryId?: string;
  }): Promise<SearchResponse> {
    return getJson(buildUrl(CATALOG_BASE, '/search', { ...params }));
  },

  suggest(q: string): Promise<SuggestResponse> {
    return getJson(buildUrl(CATALOG_BASE, '/search/suggest', { q }));
  },
};

/** Moi loi goi den order-service deu mang theo phien gio hang. */
async function orderFetch<T>(
  path: string,
  sessionId: string,
  init: RequestInit = {},
): Promise<T> {
  const url = `${ORDER_BASE}${path}`;

  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-cart-session': sessionId,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(response.status, url, message ?? `${response.status} ${response.statusText}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const orderApi = {
  getCart(sessionId: string): Promise<CartView> {
    return orderFetch('/cart', sessionId);
  },

  addItem(sessionId: string, productId: string, quantity: number): Promise<CartView> {
    return orderFetch('/cart/items', sessionId, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  },

  setQuantity(sessionId: string, productId: string, quantity: number): Promise<CartView> {
    return orderFetch(`/cart/items/${encodeURIComponent(productId)}`, sessionId, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  checkout(sessionId: string, email: string): Promise<CheckoutResult> {
    return orderFetch('/orders/checkout', sessionId, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getOrder(sessionId: string, orderNumber: string): Promise<OrderView> {
    return orderFetch(`/orders/${encodeURIComponent(orderNumber)}`, sessionId);
  },
};
