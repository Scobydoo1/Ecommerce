import type { CartLine } from '@ecommerce/types';
import { CartRuleError } from '../cart/cartRules';

export interface OrderLineSnapshot {
  productId: string;
  nameSnapshot: string;
  skuSnapshot: string;
  unitPriceCents: number;
  quantity: number;
}

export interface OrderSnapshot {
  items: OrderLineSnapshot[];
  subtotalCents: number;
}

/** Bang chu khong co I, O, 0, 1 de nguoi doc ma qua dien thoai khong nham. */
const SUFFIX_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function randomSuffix(length = 6): string {
  let suffix = '';
  for (let i = 0; i < length; i += 1) {
    suffix += SUFFIX_ALPHABET[Math.floor(Math.random() * SUFFIX_ALPHABET.length)];
  }
  return suffix;
}

export function generateOrderNumber(now: Date, suffix: string): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  return `ORD-${year}${month}${day}-${suffix}`;
}

/**
 * Dong bang gio hang thanh don hang.
 *
 * Ten, SKU va gia deu duoc CHUP LAI: doi gia ben catalog ngay mai khong duoc
 * phep lam thay doi mot don da dat. Tam tinh cung tinh lai tu gia x so luong
 * chu khong tin `lineTotal` client gui len.
 */
export function buildOrderSnapshot(
  lines: CartLine[],
  skuByProductId: Record<string, string>,
): OrderSnapshot {
  if (lines.length === 0) {
    throw new CartRuleError('Gio hang trong, khong tao duoc don');
  }

  const items = lines.map((line) => {
    if (line.quantity > line.stock) {
      throw new CartRuleError(
        `${line.name}: chi con ${line.stock} san pham trong ton kho, khong the dat ${line.quantity}`,
      );
    }

    const skuSnapshot = skuByProductId[line.productId];
    if (skuSnapshot === undefined) {
      throw new CartRuleError(`Thieu SKU cua san pham ${line.productId}`);
    }

    return {
      productId: line.productId,
      nameSnapshot: line.name,
      skuSnapshot,
      unitPriceCents: line.unitPrice.amountCents,
      quantity: line.quantity,
    };
  });

  const subtotalCents = items.reduce(
    (total, item) => total + item.unitPriceCents * item.quantity,
    0,
  );

  return { items, subtotalCents };
}
