import { addItem, calcSubtotalCents, CartItem } from '../../src/cart/cartRules';

describe('addItem', () => {
  it('them dong moi vao gio rong', () => {
    expect(addItem([], 'p1', 2, 10)).toEqual([{ productId: 'p1', quantity: 2 }]);
  });

  it('gop vao dong da co thay vi them dong trung', () => {
    const items: CartItem[] = [{ productId: 'p1', quantity: 2 }];
    expect(addItem(items, 'p1', 3, 10)).toEqual([{ productId: 'p1', quantity: 5 }]);
  });

  it('giu nguyen thu tu cac dong khac khi gop', () => {
    const items: CartItem[] = [
      { productId: 'p1', quantity: 1 },
      { productId: 'p2', quantity: 1 },
    ];
    expect(addItem(items, 'p1', 1, 10)).toEqual([
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 1 },
    ]);
  });

  it('khong sua mang goc', () => {
    const items: CartItem[] = [{ productId: 'p1', quantity: 1 }];
    addItem(items, 'p1', 1, 10);
    expect(items).toEqual([{ productId: 'p1', quantity: 1 }]);
  });

  it('tu choi so luong khong duong', () => {
    expect(() => addItem([], 'p1', 0, 10)).toThrow(/lon hon 0/i);
    expect(() => addItem([], 'p1', -1, 10)).toThrow(/lon hon 0/i);
  });

  it('tu choi khi tong sau khi gop vuot ton kho', () => {
    const items: CartItem[] = [{ productId: 'p1', quantity: 8 }];
    // 8 da co + 3 them = 11 > 10 ton kho.
    expect(() => addItem(items, 'p1', 3, 10)).toThrow(/ton kho/i);
  });

  it('cho phep dat dung bang ton kho', () => {
    expect(addItem([{ productId: 'p1', quantity: 8 }], 'p1', 2, 10)).toEqual([
      { productId: 'p1', quantity: 10 },
    ]);
  });

  it('tu choi khi ton kho bang 0', () => {
    expect(() => addItem([], 'p1', 1, 0)).toThrow(/ton kho/i);
  });
});

describe('calcSubtotalCents', () => {
  it('gio rong co tam tinh bang 0', () => {
    expect(calcSubtotalCents([], {})).toBe(0);
  });

  it('cong don nhieu dong', () => {
    const items: CartItem[] = [
      { productId: 'p1', quantity: 2 },
      { productId: 'p2', quantity: 3 },
    ];
    expect(calcSubtotalCents(items, { p1: 199_000, p2: 50_000 })).toBe(2 * 199_000 + 3 * 50_000);
  });

  it('bao loi khi thieu gia cua mot san pham', () => {
    // Tha noi con hon tinh thanh tien thieu mot mon.
    expect(() => calcSubtotalCents([{ productId: 'p1', quantity: 1 }], {})).toThrow(/p1/);
  });

  it('luon tra ve so nguyen', () => {
    const total = calcSubtotalCents([{ productId: 'p1', quantity: 3 }], { p1: 33_333 });
    expect(Number.isInteger(total)).toBe(true);
    expect(total).toBe(99_999);
  });
});
