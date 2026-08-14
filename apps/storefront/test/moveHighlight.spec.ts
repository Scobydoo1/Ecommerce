import { moveHighlight, NO_HIGHLIGHT } from '@/components/search-bar/moveHighlight';

describe('moveHighlight', () => {
  it('khong chon gi khi danh sach rong', () => {
    expect(moveHighlight(NO_HIGHLIGHT, 1, 0)).toBe(NO_HIGHLIGHT);
    expect(moveHighlight(NO_HIGHLIGHT, -1, 0)).toBe(NO_HIGHLIGHT);
  });

  it('mui ten xuong tu o nhap nhay vao muc dau tien', () => {
    expect(moveHighlight(NO_HIGHLIGHT, 1, 3)).toBe(0);
  });

  it('mui ten len tu o nhap nhay xuong muc cuoi cung', () => {
    // Nguoi dung muon xem goi y cuoi ma khong phai bam xuong ba lan.
    expect(moveHighlight(NO_HIGHLIGHT, -1, 3)).toBe(2);
  });

  it('di chuyen trong danh sach', () => {
    expect(moveHighlight(0, 1, 3)).toBe(1);
    expect(moveHighlight(2, -1, 3)).toBe(1);
  });

  it('cuon vong tu cuoi ve dau va nguoc lai', () => {
    expect(moveHighlight(2, 1, 3)).toBe(0);
    expect(moveHighlight(0, -1, 3)).toBe(2);
  });

  it('gioi han lai chi so vuot khoi danh sach da co ngan di', () => {
    // Danh sach goi y co the ngan lai giua chung khi ket qua moi ve.
    expect(moveHighlight(9, 1, 3)).toBe(0);
  });
});
