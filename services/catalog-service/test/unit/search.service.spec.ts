import { SearchService } from '../../src/search/search.service';
import type { SearchHit, SearchOptions, SearchStrategy } from '../../src/search/types';
import type { PrismaService } from '../../src/common/prisma.service';

function productRow(id: string, name: string) {
  return {
    id,
    sku: `SKU-${id}`,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    description: null,
    priceCents: 1000,
    currency: 'VND',
    stock: 1,
    status: 'ACTIVE' as const,
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
    category: null,
  };
}

class StubStrategy implements SearchStrategy {
  readonly name = 'stub';
  readonly calls: { query: string; options: SearchOptions }[] = [];

  constructor(private readonly hits: SearchHit[]) {}

  async search(query: string, options: SearchOptions): Promise<SearchHit[]> {
    this.calls.push({ query, options });
    return this.hits;
  }
}

function makeService(strategy: SearchStrategy, rows: ReturnType<typeof productRow>[]) {
  const findMany = jest.fn().mockResolvedValue(rows);
  const prisma = { product: { findMany } } as unknown as PrismaService;
  return { service: new SearchService([strategy], prisma), findMany };
}

describe('SearchService.search', () => {
  it('returns nothing and never touches a strategy for a blank query', async () => {
    const strategy = new StubStrategy([{ productId: 'p1', score: 1 }]);
    const { service, findMany } = makeService(strategy, []);

    const response = await service.search('   ', {});

    expect(response.items).toEqual([]);
    expect(response.total).toBe(0);
    expect(strategy.calls).toHaveLength(0);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('passes the normalized query down to the strategy', async () => {
    const strategy = new StubStrategy([]);
    const { service } = makeService(strategy, []);

    await service.search('  Áo   THUN ', {});

    expect(strategy.calls[0].query).toBe('ao thun');
  });

  it('orders hydrated products by fused rank, not by database order', async () => {
    const strategy = new StubStrategy([
      { productId: 'p3', score: 0 },
      { productId: 'p1', score: 0 },
      { productId: 'p2', score: 0 },
    ]);
    // Prisma tra ve theo thu tu bat ky - ket qua phai theo thu tu fused.
    const { service } = makeService(strategy, [
      productRow('p1', 'Mot'),
      productRow('p2', 'Hai'),
      productRow('p3', 'Ba'),
    ]);

    const response = await service.search('ao', {});

    expect(response.items.map((item) => item.id)).toEqual(['p3', 'p1', 'p2']);
  });

  it('reports the full match count while returning only one page', async () => {
    const hits = ['p1', 'p2', 'p3'].map((productId) => ({ productId, score: 0 }));
    const strategy = new StubStrategy(hits);
    const { service } = makeService(strategy, [productRow('p1', 'Mot')]);

    const response = await service.search('ao', { limit: 1 });

    expect(response.total).toBe(3);
    expect(response.items).toHaveLength(1);
  });

  it('clamps an oversized limit to 50', async () => {
    const strategy = new StubStrategy([]);
    const { service } = makeService(strategy, []);

    const response = await service.search('ao', { limit: 9999 });

    expect(response.limit).toBe(50);
  });

  it('drops hits whose product has since disappeared', async () => {
    const strategy = new StubStrategy([
      { productId: 'p1', score: 0 },
      { productId: 'ghost', score: 0 },
    ]);
    const { service } = makeService(strategy, [productRow('p1', 'Mot')]);

    const response = await service.search('ao', {});

    expect(response.items.map((item) => item.id)).toEqual(['p1']);
  });

  it('echoes the raw query and the normalized form', async () => {
    const strategy = new StubStrategy([]);
    const { service } = makeService(strategy, []);

    const response = await service.search('Đồng hồ', {});

    expect(response.query).toBe('Đồng hồ');
    expect(response.normalizedQuery).toBe('dong ho');
  });
});

describe('SearchService.suggest', () => {
  it('returns at most eight lightweight suggestions', async () => {
    const hits = Array.from({ length: 20 }, (_, i) => ({ productId: `p${i}`, score: 0 }));
    const rows = Array.from({ length: 20 }, (_, i) => productRow(`p${i}`, `San pham ${i}`));
    const { service } = makeService(new StubStrategy(hits), rows);

    const response = await service.suggest('san pham');

    expect(response.items).toHaveLength(8);
    expect(Object.keys(response.items[0])).toEqual(['name', 'slug']);
  });

  it('returns nothing for a blank query', async () => {
    const { service } = makeService(new StubStrategy([]), []);

    expect((await service.suggest('  ')).items).toEqual([]);
  });
});
