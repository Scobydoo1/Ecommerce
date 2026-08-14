import { formatMoney } from '../lib/formatMoney';

describe('formatMoney', () => {
  it('formats VND with thousand separators and no decimals', () => {
    expect(formatMoney({ amountCents: 199_000, currency: 'VND' })).toBe('199.000 ₫');
  });

  it('formats zero as a real price, not an empty string', () => {
    expect(formatMoney({ amountCents: 0, currency: 'VND' })).toBe('0 ₫');
  });

  it('formats millions without losing digits', () => {
    expect(formatMoney({ amountCents: 2_490_000, currency: 'VND' })).toBe('2.490.000 ₫');
  });

  it('never renders a floating point artefact', () => {
    expect(formatMoney({ amountCents: 1_290_000, currency: 'VND' })).not.toMatch(/[.,]\d{2}$/);
  });
});
