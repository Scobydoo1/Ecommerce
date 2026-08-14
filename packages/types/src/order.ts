import type { Money } from './product';

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface OrderItemView {
  productId: string;
  name: string;
  sku: string;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
}

export interface OrderView {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  email: string | null;
  subtotal: Money;
  total: Money;
  items: OrderItemView[];
  createdAt: string;
}

/** Tra ve khi tao don: kem `clientSecret` de trinh duyet xac nhan thanh toan. */
export interface CheckoutResult {
  order: OrderView;
  clientSecret: string | null;
}
