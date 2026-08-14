import type { CartLine } from '@ecommerce/types';
import {
  buildOrderSnapshot,
  generateOrderNumber,
  randomSuffix,
} from '../../src/orders/orderRules';

const line = (over: Partial<CartLine> = {}): CartLine => ({
  productId: 'p1',
  name: 'Áo thun nam cotton',
  slug: 'ao-thun-nam-cotton',
  imageUrl: null,
  unitPrice: { amountCents: 199_000, currency: 'VND' },
  quantity: 2,
  lineTotal: { amountCents: 398_000, currency: 'VND' },
  stock: 40,
  ...over,
});

describe('generateOrderNumber', () => {
  it('dung dinh dang ORD-YYYYMMDD-XXXXXX', () => {
    expect(generateOrderNumber(new Date('2026-08-14T10:00:00Z'), 'A1B2C3')).toBe(
      'ORD-20260814-A1B2C3',
    );
  });

  it('dem ngay bang so 0 dung cho thang va ngay mot chu so', () => {
    expect(generateOrderNumber(new Date('2026-01-05T00:00:00Z'), 'ZZZZZZ')).toBe(
      'ORD-20260105-ZZZZZZ',
    );
  });
});

describe('randomSuffix', () => {
  it('tra ve 6 ky tu in hoa hoac so', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(randomSuffix()).toMatch(/^[0-9A-Z]{6}$/);
    }
  });
});

describe('buildOrderSnapshot', () => {
  it('chup lai ten, sku va gia tai thoi diem dat', () => {
    const snapshot = buildOrderSnapshot([line()], { p1: 'AO-THUN-001' });

    expect(snapshot.items).toEqual([
      {
        productId: 'p1',
        nameSnapshot: 'Áo thun nam cotton',
        skuSnapshot: 'AO-THUN-001',
        unitPriceCents: 199_000,
        quantity: 2,
      },
    ]);
  });

  it('tinh tam tinh tu chinh ban chup, khong tu lineTotal gui len', () => {
    // lineTotal cua client co the sai hoac bi sua; chi gia x so luong moi dung.
    const dishonest = line({ lineTotal: { amountCents: 1, currency: 'VND' } });
    expect(buildOrderSnapshot([dishonest], { p1: 'AO-THUN-001' }).subtotalCents).toBe(398_000);
  });

  it('cong don nhieu dong', () => {
    const lines = [
      line(),
      line({ productId: 'p2', quantity: 1, unitPrice: { amountCents: 50_000, currency: 'VND' } }),
    ];
    const snapshot = buildOrderSnapshot(lines, { p1: 'AO-THUN-001', p2: 'TN-002' });
    expect(snapshot.subtotalCents).toBe(398_000 + 50_000);
  });

  it('tu choi gio rong', () => {
    expect(() => buildOrderSnapshot([], {})).toThrow(/gio hang trong/i);
  });

  it('tu choi khi mot dong vuot ton kho hien tai', () => {
    expect(() => buildOrderSnapshot([line({ quantity: 41, stock: 40 })], { p1: 'X' })).toThrow(
      /ton kho/i,
    );
  });

  it('tu choi khi thieu sku cua san pham', () => {
    expect(() => buildOrderSnapshot([line()], {})).toThrow(/p1/);
  });
});
