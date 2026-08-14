/**
 * Chuan hoa cau truy van truoc khi dua xuong bat ky strategy nao.
 *
 * Muc tieu: "áo thun", "ao thun", "  Aó   THUN " deu quy ve cung mot chuoi,
 * nho vay index GIN tren `lower(unaccent(name))` khop duoc ca ba.
 *
 * Dau cau bi thay bang khoang trang chu khong bi xoa han, de "giay/dep"
 * thanh hai tu thay vi dinh lien thanh "giaydep".
 */
export function normalizeQuery(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
