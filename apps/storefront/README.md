# storefront

Next.js 14 (App Router) — giao diện khách hàng của Chợ Ngọc.

## Chạy

```bash
pnpm --filter storefront dev      # http://localhost:3000
```

Cần `catalog-service` đang chạy ở `:3001` (xem `docs/setup.md`). Biến môi trường:

| Biến | Mặc định | Dùng cho |
|---|---|---|
| `NEXT_PUBLIC_CATALOG_API_URL` | `http://localhost:3001` | sản phẩm, danh mục, tìm kiếm |
| `NEXT_PUBLIC_ORDER_API_URL` | `http://localhost:3002` | giỏ hàng, đơn hàng |

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `app/(shop)/page.tsx` | Trang chủ — hero là chính ô tìm kiếm |
| `app/(shop)/categories/[slug]/` | Danh sách sản phẩm theo danh mục |
| `app/(shop)/search/` | Trang kết quả tìm kiếm |
| `app/(shop)/products/[slug]/` | Chi tiết sản phẩm (RSC + `generateMetadata`) |
| `lib/api-client.ts` | Wrapper `fetch` có kiểu cho các service |
| `lib/formatMoney.ts` | Nơi duy nhất đổi integer cents thành chuỗi hiển thị |
| `components/search-bar/` | Ô tìm kiếm có gợi ý |
| `components/product-card/` | Thẻ sản phẩm |

## Ghi chú thiết kế

Bảng màu ngọc bích `#0F6B5C` + vàng thẻ `#F2A900` trên nền trắng. Chữ hiển thị
Bricolage Grotesque, chữ thân Be Vietnam Pro — chọn Be Vietnam Pro vì nó xử lý
dấu chồng của tiếng Việt (mũ + thanh) không bị chạm nhau.

Điểm nhấn thị giác duy nhất được phép "to tiếng" là **thẻ giá khía góc** trên
ảnh sản phẩm (`.price-tag` trong `app/globals.css`), mượn hình cái thẻ giá buộc
dây ở chợ. Mọi thứ còn lại giữ im lặng.

## Test

```bash
pnpm --filter storefront test
```
