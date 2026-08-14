/**
 * Chuyen ten san pham thanh slug an toan cho URL.
 *
 * NFD tach dau ra khoi nguyen am roi bo di, nhung `đ`/`Đ` (U+0111/U+0110)
 * khong co decomposition nen phai thay tay.
 */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Tra ve slug chua bi chiem. Neu `base` da co, them hau to tang dan: -2, -3...
 * Bo qua cac hau to da bi chiem thay vi dung lai chung.
 */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    return base;
  }

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}
