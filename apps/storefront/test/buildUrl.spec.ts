import { buildUrl } from '@/lib/api-client';

describe('buildUrl', () => {
  it('tra ve duong dan tran khi khong co tham so', () => {
    expect(buildUrl('http://localhost:3001', '/products')).toBe('http://localhost:3001/products');
  });

  it('bo qua tham so undefined va null', () => {
    expect(
      buildUrl('http://localhost:3001', '/products', {
        limit: 12,
        categoryId: undefined,
        status: null,
      }),
    ).toBe('http://localhost:3001/products?limit=12');
  });

  it('giu lai so 0 va gia tri false', () => {
    // offset=0 la gia tri hop le, khong duoc coi la "rong" ma bo di.
    expect(buildUrl('http://localhost:3001', '/search', { offset: 0, rootOnly: false })).toBe(
      'http://localhost:3001/search?offset=0&rootOnly=false',
    );
  });

  it('bo qua chuoi rong', () => {
    expect(buildUrl('http://localhost:3001', '/search', { q: '', limit: 8 })).toBe(
      'http://localhost:3001/search?limit=8',
    );
  });

  it('ma hoa dau tieng Viet va khoang trang', () => {
    expect(buildUrl('http://localhost:3001', '/search', { q: 'áo thun' })).toBe(
      'http://localhost:3001/search?q=%C3%A1o+thun',
    );
  });

  it('khong tao dau gach cheo doi khi base co gach cheo cuoi', () => {
    expect(buildUrl('http://localhost:3001/', '/products')).toBe('http://localhost:3001/products');
  });
});
