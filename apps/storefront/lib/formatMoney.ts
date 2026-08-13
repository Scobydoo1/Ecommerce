import type { Money } from '@ecommerce/types';

/**
 * Tien luon di trong he thong duoi dang integer cents. Ham nay la CHO DUY NHAT
 * chuyen no thanh chuoi hien thi, de khong cho nao lo dung so thap phan.
 */
export function formatMoney(money: Money): string {
  const formatted = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(money.amountCents);

  // U+00A0 (khoang trang khong ngat dong) giu ky hieu tien te dinh lien voi so,
  // khong bi roi xuong dong duoi khi the bi bop hep. Dung dung quy uoc cua Intl.
  const NBSP = ' ';

  return money.currency === 'VND'
    ? `${formatted}${NBSP}₫`
    : `${formatted}${NBSP}${money.currency}`;
}
