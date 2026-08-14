# API reference — Phase 1

Mọi endpoint trả JSON. Tiền luôn là `{ amountCents: number, currency: string }`
với `amountCents` là số nguyên.

## catalog-service — `:3001`

### `GET /search`

| Tham số | Mặc định | Ghi chú |
|---|---|---|
| `q` | — | Chuỗi tìm kiếm, tối đa 200 ký tự |
| `limit` | 20 | Trần 100 do service áp |
| `offset` | 0 | |
| `categoryId` | — | UUID |

```json
{
  "query": "ao thunn",
  "normalizedQuery": "ao thunn",
  "total": 1,
  "limit": 20,
  "offset": 0,
  "items": [{ "id": "…", "sku": "AO-THUN-001", "name": "Áo thun nam cotton", "slug": "ao-thun-nam-cotton", "price": { "amountCents": 199000, "currency": "VND" }, "stock": 40, "status": "ACTIVE", "imageUrl": "…", "categoryId": "…" }]
}
```

Giới hạn 60 lần/phút.

### `GET /search/suggest?q=`

Trả tối đa 8 gợi ý, chỉ `name` + `slug`. Giới hạn 120 lần/phút.

### Sản phẩm

| Method | Đường dẫn | Ghi chú |
|---|---|---|
| `GET` | `/products` | `limit`, `offset`, `categoryId`, `status` |
| `GET` | `/products/slug/:slug` | Khai báo trước `:id` để slug không bị nuốt |
| `GET` | `/products/:id` | UUID |
| `POST` | `/products` | 409 nếu trùng `sku` |
| `PATCH` | `/products/:id` | |
| `DELETE` | `/products/:id` | 204 |

### Danh mục

| Method | Đường dẫn |
|---|---|
| `GET` | `/categories` (`rootOnly=true` để lấy danh mục gốc) |
| `GET` | `/categories/slug/:slug` |
| `POST` | `/categories` |

## order-service — `:3002`

Mọi endpoint giỏ hàng và checkout cần header `x-cart-session`. Thiếu → 400.

| Method | Đường dẫn | Ghi chú |
|---|---|---|
| `GET` | `/cart` | |
| `POST` | `/cart/items` | `{ productId, quantity }`, gộp vào dòng đã có |
| `PUT` | `/cart/items/:productId` | `{ quantity }` tuyệt đối, `0` = xoá |
| `DELETE` | `/cart/items/:productId` | |
| `DELETE` | `/cart` | 204 |
| `POST` | `/orders/checkout` | `{ email, userId? }` → `{ order, clientSecret }` |
| `GET` | `/orders/:orderNumber` | |
| `POST` | `/payments/stripe/webhook` | Cần header `stripe-signature` |

Vượt tồn kho → 400 kèm số còn lại. Giỏ trống lúc checkout → 400.

## storefront — `:3000`

Route handler nội bộ, trình duyệt gọi cùng gốc:

| Method | Đường dẫn | Chuyển tiếp tới |
|---|---|---|
| `GET` | `/api/suggest?q=` | catalog `/search/suggest` |
| `POST` | `/api/cart/items` | order `/cart/items` |
| `PUT`/`DELETE` | `/api/cart/items/:productId` | order `/cart/items/:productId` |
| `POST` | `/api/checkout` | order `/orders/checkout`, gắn thêm `userId` nếu đã đăng nhập |
| `POST` | `/api/register` | Tạo tài khoản, 409 nếu trùng email |
| `GET`/`POST` | `/api/auth/*` | Auth.js |
