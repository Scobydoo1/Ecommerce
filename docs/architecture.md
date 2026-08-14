# Kiến trúc — Phase 1

Bốn quyết định kiến trúc gốc (AD-1..AD-4) nằm trong
[`superpowers/specs/2026-08-13-phase-1-mvp-design.md`](superpowers/specs/2026-08-13-phase-1-mvp-design.md).
Tài liệu này mô tả hệ thống *như nó đang chạy*.

## Sơ đồ

```
                    trình duyệt
                         │
                         ▼
        ┌────────────────────────────────┐
        │  storefront (Next.js 14) :3000 │
        │  SSR · Auth.js · proxy /api/*  │
        └───┬────────────────────────┬───┘
            │                        │
            ▼                        ▼
  ┌──────────────────┐    ┌────────────────────┐
  │ catalog-service  │◀───│   order-service    │
  │      :3001       │HTTP│       :3002        │
  └────────┬─────────┘    └─────┬─────────┬────┘
           │                    │         │
           ▼                    ▼         ▼
   Postgres schema        Postgres     Redis
      `catalog`           `orders`   cart:{id}
                                          
        Postgres schema `auth`  ◀── @ecommerce/auth-db
```

Một database `ecommerce`, ba schema tách biệt. Mỗi schema có lịch sử migration
riêng nên hai service không giẫm chân nhau, mà dev vẫn chỉ chạy một container
Postgres.

## Ai sở hữu cái gì

| Dữ liệu | Chủ sở hữu | Ai khác đọc thế nào |
|---|---|---|
| Sản phẩm, danh mục, tồn kho | catalog-service | HTTP `GET /products/:id` |
| Giỏ hàng | order-service (Redis) | — |
| Đơn hàng | order-service (Postgres) | — |
| Tài khoản | `@ecommerce/auth-db` (storefront dùng) | — |

**order-service không đọc thẳng bảng của catalog.** Giá và tồn kho luôn hỏi qua
HTTP, để chỉ có một nguồn sự thật. Đổi lại, checkout phụ thuộc catalog-service
còn sống.

## Đường đi của một lần tìm kiếm

```
"ao thunn"
   │
   ├─ normalizeQuery()      bỏ dấu, lowercase, gộp khoảng trắng  → "ao thunn"
   │
   ├─ TrigramStrategy       word_similarity trên lower(unaccent(name))
   │                        + trọng số mô tả, ngưỡng 0.15, status=ACTIVE
   │
   ├─ fuseResults()         Reciprocal Rank Fusion, k=60
   │                        (Phase 1 chỉ một strategy, nhưng RRF đã sẵn)
   │
   └─ hydrate               lấy đầy đủ Product theo thứ tự đã xếp hạng
```

Cột `embedding vector(1536)` và index HNSW đã được tạo từ migration đầu tiên
nhưng để `NULL` suốt Phase 1. Phase 2 chỉ việc điền vào và đăng ký thêm
`VectorStrategy` — `fuseResults` không phải sửa gì.

Hai lỗi thật đã bắt được trong quá trình dựng, cả hai đều do đo chứ không do đoán:

- `similarity()` không tách được truy vấn ngắn đúng khỏi truy vấn sai, phải đổi
  sang `word_similarity`.
- Trọng số mô tả chỉ áp khi tính điểm mà không áp khi lọc, khiến "đồng hồ" kéo
  về cả tai nghe lẫn giày sneaker.

## Tiền

Mọi số tiền là **integer cents**, không bao giờ float, ở mọi tầng. Chỗ duy nhất
đổi sang chuỗi hiển thị là `apps/storefront/lib/formatMoney.ts`.

## Đơn hàng chụp lại dữ liệu

`OrderItem` giữ `nameSnapshot`, `skuSnapshot`, `unitPriceCents` tại thời điểm
đặt. Đổi giá bên catalog ngày mai không được phép làm thay đổi một đơn đã đặt.
Tạm tính cũng tính lại từ giá × số lượng chứ không tin `lineTotal` client gửi lên.

## Thanh toán

Chỉ lưu `stripePaymentIntentId`. Không bao giờ chạm vào thông tin thẻ, không log
payload thanh toán. Khi thiếu `STRIPE_SECRET_KEY`, `StripeService` chạy ở chế độ
tắt: đơn vẫn tạo được và dừng ở `PENDING`, nhờ vậy thử được toàn bộ luồng mua
hàng trên máy chưa có khoá.

## Giới hạn đã biết của Phase 1

- **Chưa trừ tồn kho khi đặt hàng.** Đơn chỉ *kiểm tra* tồn kho tại thời điểm
  checkout. Hai người mua món cuối cùng cùng lúc thì cả hai đều đặt được. Trừ kho
  cần một endpoint giữ chỗ bên catalog-service — nằm ngoài phạm vi Phase 1.
- **Chưa gửi email xác nhận.** Trang xác nhận hiện đủ thông tin đơn; email thuộc
  Phase 3.
- **Chưa có Meilisearch.** `pg_trgm` đang đủ nhanh với dữ liệu hiện tại; theo
  CLAUDE.md chỉ thêm khi đo thấy chậm.
- **Leg thanh toán bằng thẻ chưa chạy thật** vì máy dev chưa cấu hình khoá Stripe
  test. Phần tạo PaymentIntent và xác thực webhook đã viết nhưng chưa kiểm chứng
  end-to-end.

## Ghi chú thiết kế giao diện

Bảng màu ngọc bích `#0F6B5C` + vàng thẻ `#F2A900` trên nền trắng, cố tình tránh
ba lối mòn quen thuộc (nền kem + serif + đất nung; nền đen + xanh chanh; khổ báo
kẻ chỉ). Chữ hiển thị Bricolage Grotesque, chữ thân Be Vietnam Pro — chọn Be
Vietnam Pro vì nó xử lý dấu chồng của tiếng Việt (mũ + thanh) không bị chạm nhau.

Trang chủ lấy chính ô tìm kiếm làm hero, kèm ba ví dụ gõ sai bấm được, vì tìm
kiếm mờ là thứ duy nhất khiến trang này khác các trang khác. Trang kết quả hiện
dòng "bạn gõ X · tìm theo Y" khi chuỗi chuẩn hoá khác chuỗi người dùng gõ, phơi
bày đúng cơ chế đang chạy.

Điểm nhấn thị giác duy nhất được phép "to tiếng" là thẻ giá khía góc trên ảnh sản
phẩm (`.price-tag`), mượn hình cái thẻ giá buộc dây ở chợ.
