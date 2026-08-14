export interface CartItem {
  productId: string;
  quantity: number;
}

/**
 * Loi do nguoi dung gay ra (so luong sai, vuot ton kho) - khac loi he thong.
 * CartService bat rieng loai nay va tra ve 400 thay vi 500.
 */
export class CartRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CartRuleError';
  }
}

/**
 * Them mot san pham vao gio, tra ve gio MOI (khong sua mang goc).
 *
 * Gop vao dong da co thay vi them dong trung: hai dong cung mot san pham se
 * lam tam tinh va kiem tra ton kho tro nen kho doan.
 */
export function addItem(
  items: CartItem[],
  productId: string,
  quantity: number,
  stock: number,
): CartItem[] {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new CartRuleError('So luong phai la so nguyen lon hon 0');
  }

  const existing = items.find((item) => item.productId === productId);
  const merged = (existing?.quantity ?? 0) + quantity;

  if (merged > stock) {
    throw new CartRuleError(
      `Chi con ${stock} san pham trong ton kho, khong the dat ${merged}`,
    );
  }

  if (!existing) {
    return [...items, { productId, quantity }];
  }

  return items.map((item) =>
    item.productId === productId ? { ...item, quantity: merged } : item,
  );
}

/**
 * Tam tinh theo integer cents. Thieu gia cua bat ky dong nao la loi:
 * tra ve tong thieu mot mon con nguy hiem hon la that bai to tieng.
 */
export function calcSubtotalCents(
  items: CartItem[],
  priceByProductId: Record<string, number>,
): number {
  return items.reduce((total, item) => {
    const unitPriceCents = priceByProductId[item.productId];

    if (unitPriceCents === undefined) {
      throw new CartRuleError(`Thieu gia cua san pham ${item.productId}`);
    }

    return total + unitPriceCents * item.quantity;
  }, 0);
}
