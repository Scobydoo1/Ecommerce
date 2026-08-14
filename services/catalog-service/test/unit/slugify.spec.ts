import { slugify, uniqueSlug } from '../../src/products/slugify';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Áo Thun Nam')).toBe('ao-thun-nam');
  });

  it('strips Vietnamese diacritics including đ', () => {
    expect(slugify('Đồng hồ Cơ')).toBe('dong-ho-co');
  });

  it('collapses punctuation and repeated separators', () => {
    expect(slugify('Tai nghe   Bluetooth -- Pro!!')).toBe('tai-nghe-bluetooth-pro');
  });

  it('trims leading and trailing separators', () => {
    expect(slugify('  --Giày Sneaker--  ')).toBe('giay-sneaker');
  });

  it('keeps digits', () => {
    expect(slugify('iPhone 15 Pro Max')).toBe('iphone-15-pro-max');
  });

  it('returns an empty string when nothing survives normalization', () => {
    expect(slugify('!!!')).toBe('');
  });
});

describe('uniqueSlug', () => {
  it('returns the base slug when it is free', () => {
    expect(uniqueSlug('ao-thun', new Set())).toBe('ao-thun');
  });

  it('appends an incrementing suffix when taken', () => {
    expect(uniqueSlug('ao-thun', new Set(['ao-thun']))).toBe('ao-thun-2');
    expect(uniqueSlug('ao-thun', new Set(['ao-thun', 'ao-thun-2']))).toBe('ao-thun-3');
  });

  it('skips over gaps rather than reusing a taken suffix', () => {
    expect(uniqueSlug('ao-thun', new Set(['ao-thun', 'ao-thun-3']))).toBe('ao-thun-2');
  });
});
