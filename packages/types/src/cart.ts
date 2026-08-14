import type { Money } from './product';

export interface CartLine {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
  /** Ton kho hien tai, de giao dien chan tang so luong qua muc. */
  stock: number;
}

export interface CartView {
  items: CartLine[];
  subtotal: Money;
  /** Tong so mon (da cong so luong), dung cho huy hieu tren header. */
  itemCount: number;
}
