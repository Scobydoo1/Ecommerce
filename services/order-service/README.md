# order-service

NestJS — giỏ hàng (Redis), đơn hàng và thanh toán Stripe. Cổng mặc định `:3002`.

## Chạy

```bash
pnpm --filter order-service prisma:generate
pnpm --filter order-service prisma:deploy
pnpm --filter order-service dev
```

Cần Postgres + Redis (`infra/docker/docker-compose.yml`) và `catalog-service`
đang chạy — giá và tồn kho luôn hỏi qua HTTP chứ không đọc thẳng bảng của
catalog.

## Biến môi trường

| Biến | Vai trò |
|---|---|
| `ORDER_DATABASE_URL` | Postgres, schema `orders` |
| `REDIS_URL` | Giỏ hàng theo phiên |
| `CATALOG_API_URL` | Nơi hỏi giá và tồn kho |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Thanh toán test mode |
| `ORDER_SERVICE_PORT` | Cổng lắng nghe (mặc định 3002) |

## API

| Method | Đường dẫn | Việc |
|---|---|---|
| `GET` | `/cart` | Xem giỏ |
| `POST` | `/cart/items` | Thêm sản phẩm |
| `PUT` | `/cart/items/:productId` | Đặt số lượng tuyệt đối (`0` = xoá) |
| `DELETE` | `/cart/items/:productId` | Xoá một dòng |
| `DELETE` | `/cart` | Xoá cả giỏ |
| `POST` | `/orders/checkout` | Tạo đơn từ giỏ + PaymentIntent |
| `GET` | `/orders/:orderNumber` | Xem đơn |
| `POST` | `/payments/stripe/webhook` | Stripe gọi về |

Mọi endpoint giỏ hàng cần header `x-cart-session`. Storefront sinh giá trị này
và giữ trong cookie HttpOnly.

## Ghi chú thiết kế

- **Prisma client generate vào `generated/prisma`**, không dùng đường mặc định:
  catalog-service generate vào gói `@prisma/client` dùng chung, để mặc định cả
  hai thì lần generate sau đè lên client của service kia.
- **Đơn hàng chụp lại tên, SKU và giá** tại thời điểm đặt. Đổi giá bên catalog
  sau này không được phép làm thay đổi một đơn đã đặt.
- **Không lưu thông tin thẻ.** Chỉ giữ `stripePaymentIntentId`.

## Test

```bash
pnpm --filter order-service test
```
