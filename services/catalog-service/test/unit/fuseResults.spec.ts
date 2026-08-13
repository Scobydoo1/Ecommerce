import { fuseResults } from '../../src/search/fuseResults';
import type { RankedList } from '../../src/search/types';

const list = (strategy: string, ids: string[]): RankedList => ({
  strategy,
  hits: ids.map((productId) => ({ productId, score: 0 })),
});

describe('fuseResults', () => {
  it('returns an empty array for no lists', () => {
    expect(fuseResults([])).toEqual([]);
  });

  it('preserves order for a single list', () => {
    const out = fuseResults([list('trigram', ['a', 'b', 'c'])]);
    expect(out.map((h) => h.productId)).toEqual(['a', 'b', 'c']);
  });

  it('scores rank 1 as 1/(k+1)', () => {
    const out = fuseResults([list('trigram', ['a'])], 60);
    expect(out[0].score).toBeCloseTo(1 / 61, 10);
  });

  it('ranks a document found by both strategies above one found by only the top of a single strategy', () => {
    const out = fuseResults([
      list('trigram', ['x', 'shared']),
      list('vector', ['y', 'shared']),
    ]);
    expect(out[0].productId).toBe('shared');
  });

  it('breaks score ties deterministically by productId', () => {
    const out = fuseResults([list('trigram', ['b']), list('vector', ['a'])]);
    expect(out.map((h) => h.productId)).toEqual(['a', 'b']);
  });

  it('ignores empty lists without affecting scores', () => {
    const withEmpty = fuseResults([list('trigram', ['a', 'b']), list('vector', [])]);
    const without = fuseResults([list('trigram', ['a', 'b'])]);
    expect(withEmpty).toEqual(without);
  });

  it('honours a custom k, which flattens the gap between ranks', () => {
    const small = fuseResults([list('trigram', ['a', 'b'])], 1);
    const large = fuseResults([list('trigram', ['a', 'b'])], 1000);

    const smallGap = small[0].score - small[1].score;
    const largeGap = large[0].score - large[1].score;

    expect(largeGap).toBeLessThan(smallGap);
  });

  it('does not mutate the input lists', () => {
    const input = [list('trigram', ['a', 'b'])];
    fuseResults(input);
    expect(input[0].hits.map((h) => h.score)).toEqual([0, 0]);
  });
});
