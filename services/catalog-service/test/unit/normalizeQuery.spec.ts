import { normalizeQuery } from '../../src/search/normalizeQuery';

describe('normalizeQuery', () => {
  it('treats accented, unaccented and mis-cased input as identical', () => {
    const expected = 'ao thun';
    expect(normalizeQuery('áo thun')).toBe(expected);
    expect(normalizeQuery('ao thun')).toBe(expected);
    expect(normalizeQuery('  Aó   THUN ')).toBe(expected);
  });

  it('maps đ to d', () => {
    expect(normalizeQuery('Đồng hồ')).toBe('dong ho');
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(normalizeQuery('   ')).toBe('');
  });

  it('preserves digits and internal single spaces', () => {
    expect(normalizeQuery('iPhone 15 Pro')).toBe('iphone 15 pro');
  });

  it('drops punctuation that would break a trigram match', () => {
    expect(normalizeQuery('tai-nghe, bluetooth!')).toBe('tai nghe bluetooth');
  });

  it('keeps words separated rather than merging them', () => {
    expect(normalizeQuery('giay/dep')).toBe('giay dep');
  });
});
