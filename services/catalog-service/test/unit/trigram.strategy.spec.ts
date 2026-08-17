import { TrigramStrategy } from '../../src/search/strategies/trigram.strategy';
import type { PrismaService } from '../../src/common/prisma.service';

function makeStrategy(): TrigramStrategy {
  const prisma = { $queryRaw: jest.fn() } as unknown as PrismaService;
  return new TrigramStrategy(prisma);
}

const page = { limit: 10, offset: 0 };

describe('TrigramStrategy.buildQuery', () => {
  it('binds the user query instead of interpolating it into the SQL text', () => {
    const query = makeStrategy().buildQuery('ao thun', page);

    expect(query.values).toContain('ao thun');
    expect(query.sql).not.toContain('ao thun');
  });

  it('only ever returns ACTIVE products', () => {
    expect(makeStrategy().buildQuery('ao', page).sql).toContain('ACTIVE');
  });

  it('compares on lower(immutable_unaccent(...)) so diacritics and case do not matter', () => {
    // `immutable_unaccent` chu khong phai `unaccent`: xem migration init - dung
    // thang unaccent doi quyen superuser va hong tren Postgres quan ly.
    expect(makeStrategy().buildQuery('ao', page).sql).toContain(
      'lower("catalog".immutable_unaccent(',
    );
  });

  it('ghi ro schema o moi dinh danh, khong dua vao search_path', () => {
    // Qua PgBouncer o che do transaction pooling (Neon, Supabase), `search_path`
    // Prisma dat luc ket noi khong con hieu luc cho truy van sau -> SQL tho
    // khong kem schema se chet voi 42P01. Da xay ra that tren Neon.
    const { sql } = makeStrategy().buildQuery('ao', page);

    expect(sql).toContain('"catalog"."Product"');
    expect(sql).not.toMatch(/FROM\s+"Product"/);
    expect(sql).not.toMatch(/[^.]immutable_unaccent\(/);
  });

  it('applies the similarity threshold as a bound parameter', () => {
    expect(makeStrategy().buildQuery('ao', page).values).toContain(0.45);
  });

  it('uses word_similarity so a short query can still match a long product name', () => {
    expect(makeStrategy().buildQuery('ao', page).sql).toContain('word_similarity(');
  });

  it('binds limit and offset', () => {
    const query = makeStrategy().buildQuery('ao', { limit: 25, offset: 50 });

    expect(query.values).toEqual(expect.arrayContaining([25, 50]));
  });

  it('filters by category only when one is supplied', () => {
    const withoutCategory = makeStrategy().buildQuery('ao', page);
    const withCategory = makeStrategy().buildQuery('ao', { ...page, categoryId: 'cat-1' });

    expect(withoutCategory.values).not.toContain('cat-1');
    expect(withCategory.values).toContain('cat-1');
  });

  it('names itself so fused results can be traced back to it', () => {
    expect(makeStrategy().name).toBe('trigram');
  });
});

describe('TrigramStrategy.search', () => {
  it('converts database rows into search hits', async () => {
    const $queryRaw = jest.fn().mockResolvedValue([
      { id: 'p1', score: 0.9 },
      { id: 'p2', score: 0.4 },
    ]);
    const strategy = new TrigramStrategy({ $queryRaw } as unknown as PrismaService);

    const hits = await strategy.search('ao thun', page);

    expect(hits).toEqual([
      { productId: 'p1', score: 0.9 },
      { productId: 'p2', score: 0.4 },
    ]);
  });
});
