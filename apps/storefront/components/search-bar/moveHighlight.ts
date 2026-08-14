/** Chua chon goi y nao — con tro dang o trong o nhap. */
export const NO_HIGHLIGHT = -1;

/**
 * Tinh muc goi y duoc to sang tiep theo khi bam mui ten len/xuong.
 *
 * Tach khoi component vi day la phan duy nhat co quy tac that (cuon vong,
 * nhay tu o nhap vao dau hoac cuoi danh sach) va can test doc lap.
 */
export function moveHighlight(current: number, delta: number, count: number): number {
  if (count <= 0) return NO_HIGHLIGHT;

  // Chi so cu co the tro ra ngoai khi danh sach goi y ngan lai giua chung.
  // Khi do coi nhu chua chon gi va vao lai tu dau/cuoi, thay vi keo chi so
  // cu ve mot vi tri tuy tien.
  const outOfRange = current < 0 || current >= count;
  if (outOfRange) {
    return delta > 0 ? 0 : count - 1;
  }

  return (current + delta + count) % count;
}
