# Còn phải làm gì để hoàn thiện dự án

Cập nhật 2026-08-14. Tài liệu này liệt kê **mọi việc còn lại**, xếp theo thứ tự
nên làm. Trạng thái hiện tại: Phase 1 đạt Definition of Done, trừ hai điểm ghi ở
mục 1.

Ký hiệu công sức: **S** = dưới nửa ngày · **M** = 1–3 ngày · **L** = trên 1 tuần.

---

## 0. Bảng tổng quan

| Nhóm | Việc | Công sức | Chặn cái gì |
|---|---|---|---|
| 1 | Đóng nốt hai lỗ hổng Phase 1 | M | Tuyên bố "Phase 1 xong hoàn toàn" |
| 2 | ~~Đưa lên mạng để demo~~ — **phần chuẩn bị đã xong**, xem [deploy.md](deploy.md) | — | Đưa link vào CV |
| 3 | Phase 2 — AI Customer Service Agent | L | — |
| 4 | Phase 3 — Admin Ops Dashboard | L | Vận hành thật |
| 5 | Phase 4 — Analytics real-time | L | — |
| 6 | Việc xuyên suốt (bảo mật, quan trắc, hiệu năng) | M–L | Chạy production thật |

---

## 1. Đóng nốt hai lỗ hổng Phase 1

### 1.1 Thanh toán thẻ chưa chạy thật — **S**

Code tạo PaymentIntent ([stripe.service.ts](../services/order-service/src/payments/stripe/stripe.service.ts))
và xác thực chữ ký webhook ([stripe.controller.ts](../services/order-service/src/payments/stripe/stripe.controller.ts))
đã viết đủ nhưng **chưa từng chạy với khoá thật**, vì máy dev không có khoá
Stripe test. Hiện đơn dừng ở `PENDING`.

Việc cần làm:

1. Lấy khoá test tại dashboard.stripe.com, đặt `STRIPE_SECRET_KEY` vào `.env`.
2. Cài Stripe CLI, chạy `stripe listen --forward-to localhost:3002/payments/stripe/webhook`,
   lấy `whsec_...` đặt vào `STRIPE_WEBHOOK_SECRET`.
3. Thêm bước thanh toán ở giao diện. Hiện `clientSecret` đã được trả về từ
   `/orders/checkout` nhưng chưa có gì dùng nó — cần `@stripe/stripe-js` +
   `@stripe/react-stripe-js`, dựng `<Elements>` với `PaymentElement` trên trang
   `/checkout`, gọi `confirmPayment` với `return_url` trỏ về trang xác nhận.
4. Test bằng thẻ `4242 4242 4242 4242`, và **cả thẻ hỏng** `4000 0000 0000 0002`
   để chắc rằng webhook lật đơn sang `FAILED`.

**Xong khi:** đặt hàng bằng thẻ test → webhook về → đơn chuyển `PAID`, và
trang xác nhận hiện đúng trạng thái. Bổ sung một bước vào
[tests/e2e/checkout.spec.ts](../tests/e2e/checkout.spec.ts).

### 1.2 Chưa trừ tồn kho khi đặt hàng — **M**

Đây là lỗi đúng nghĩa, không phải thiếu tính năng. Hiện `buildOrderSnapshot` chỉ
*kiểm tra* `quantity <= stock`. Hai người mua món cuối cùng cùng lúc thì cả hai
đều đặt được, và shop bán vượt kho.

Cách sửa đúng, không phá ranh giới service:

1. Thêm vào catalog-service endpoint giữ chỗ:
   `POST /products/reservations` nhận `{ items: [{productId, quantity}], orderRef }`,
   trừ `stock` **trong một transaction** với điều kiện `stock >= quantity`
   (`UPDATE ... WHERE stock >= $1` rồi kiểm `rowCount`), trả 409 nếu không đủ.
2. `POST /products/reservations/:orderRef/release` để hoàn kho khi thanh toán hỏng.
3. `OrdersService.checkout` gọi giữ chỗ **trước khi** tạo PaymentIntent; webhook
   `payment_failed` gọi release.
4. Viết test đồng thời: hai lời gọi song song trên món còn đúng 1 cái, chỉ một
   được thành công.

**Xong khi:** test đồng thời chạy được và `stock` không bao giờ xuống dưới 0.

### 1.3 Email xác nhận đơn — **S** (thuộc Phase 3 theo CLAUDE.md)

Trang xác nhận đã hiện đủ thông tin nhưng chưa gửi email. CLAUDE.md xếp việc này
vào Phase 3, nên **không làm bây giờ** trừ khi bạn muốn demo trọn vẹn hơn.

---

## 2. Đưa lên mạng để demo (cho CV)

Chi tiết lựa chọn nền tảng đã bàn: Railway cho cả 5 thành phần (~5 $/tháng, link
mở tức thì), hoặc Vercel + Neon + Upstash + Render nếu cần miễn phí hoàn toàn
(đánh đổi: hai service NestJS ngủ, lần bấm đầu chờ ~50 giây).

### 2.1 Sửa `unaccent` để chạy được trên Postgres quản lý — **S, làm trước tiên**

[migration.sql:92](../services/catalog-service/prisma/migrations/20260813163628_init/migration.sql#L92)
có dòng:

```sql
ALTER FUNCTION unaccent(text) IMMUTABLE;
```

Hàm `unaccent` thuộc sở hữu của extension nên lệnh này cần quyền superuser.
Trên Neon, Supabase và nhiều Postgres quản lý khác nó sẽ bị từ chối — khi đó
**index tìm kiếm mờ không tạo được, tức là tính năng chính của demo chết**.

Sửa bằng cách tự tạo hàm bọc mà mình sở hữu:

```sql
CREATE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  AS $$ SELECT unaccent('unaccent', $1) $$;
```

Rồi đổi hai index và câu truy vấn trong
[trigram.strategy.ts](../services/catalog-service/src/search/strategies/trigram.strategy.ts)
sang dùng `immutable_unaccent(...)`. Sau đó không còn bị khoá vào nhà cung cấp nào.

**Xong khi:** integration test vẫn xanh, và migration chạy được trên một Postgres
quản lý bất kỳ mà không cần quyền superuser.

### 2.2 Sửa script `start` của storefront — **S**

Hiện là `dotenv -e ../../.env -- next start`. Trên production không có file
`.env` (biến do nền tảng tiêm vào) nên lệnh sẽ lỗi. Tách:

- `dev` giữ nguyên bọc `dotenv` (tiện cho máy local)
- `start` chỉ còn `next start`

### 2.3 Dockerfile cho ba service — **M**

Chưa có Dockerfile nào. Cần một cái cho mỗi app, dùng multi-stage:
`pnpm fetch` → cài deps → build → runtime image gọn. Với storefront cần bật lại
`output: 'standalone'` (đã bỏ vì Windows chặn symlink; trong Docker Linux không
có vấn đề đó) và copy `.next/standalone` + `.next/static` + `public`.

### 2.4 Chuẩn bị database production — **S**

Postgres quản lý không chạy [init.sql](../infra/docker/postgres/init.sql), nên
phải làm tay một lần:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS auth;
```

Rồi chạy ba lệnh `prisma:deploy` và hai lệnh `seed`.

### 2.5 Biến môi trường production — **S**

| Service | Biến phải đặt |
|---|---|
| storefront | `NEXT_PUBLIC_CATALOG_API_URL`, `NEXT_PUBLIC_ORDER_API_URL` (HTTPS công khai), `AUTH_URL`, `AUTH_SECRET` (sinh mới) |
| catalog-service | `CATALOG_DATABASE_URL`, `AUTH_URL` |
| order-service | `ORDER_DATABASE_URL`, `REDIS_URL`, `CATALOG_API_URL`, `AUTH_URL`, khoá Stripe |

`AUTH_URL` phải **giống hệt** domain storefront ở cả ba nơi — hai service NestJS
dùng nó làm origin CORS, lệch một ký tự là trình duyệt chặn.

### 2.6 Việc nên làm cho một demo public — **S**

- Đặt lại seed theo lịch (cron hằng đêm) để khách vọc xong không làm hỏng dữ liệu.
- Rate limit hiện là 60–120 lần/phút cho search; cân nhắc siết lại khi mở public.
- Thêm ảnh chụp màn hình vào README — người xem CV nhìn ảnh trước khi bấm link.
- Cân nhắc chặn `robots.txt` để demo không bị lập chỉ mục lẫn với hàng thật.

---

## 3. Phase 2 — AI Customer Service Agent — **L**

Nền đã sẵn: cột `embedding vector(1536)` và index HNSW đã tạo từ migration đầu,
`fuseResults` (RRF) đã viết để nhận nhiều strategy. Phase 2 **không phải sửa**
`SearchService`, chỉ cần đăng ký thêm strategy.

| Việc | Ghi chú |
|---|---|
| Dựng `services/ai-service` (FastAPI) | Có `README.md` riêng như mọi service |
| Pipeline embedding sản phẩm + FAQ | Điền vào cột `embedding` đã có sẵn |
| `VectorStrategy` trong catalog-service | Cosine distance, cắm vào `SearchService` |
| Endpoint `/chat` RAG | LangGraph, provider qua biến môi trường |
| Widget chat trên storefront | `components/chat-widget/` |
| `evals/` 20–30 câu hỏi mẫu | Không release nếu độ chính xác giảm so với baseline |

**Xong khi:** chatbot trả lời đúng câu hỏi về sản phẩm/chính sách với độ chính xác
đo được qua eval, và **có fallback nói "không chắc" thay vì bịa**.

Việc đầu tiên nên làm ở Phase 2 thực ra là bật `VectorStrategy` — nó chứng minh
kiến trúc search hai nhánh hoạt động, trước khi đụng tới chatbot.

---

## 4. Phase 3 — Admin Ops Dashboard — **L**

| Việc | Ghi chú |
|---|---|
| `apps/admin` (React + Vite) | Chưa tạo |
| Quản lý sản phẩm, đơn hàng, tồn kho | API CRUD đã có sẵn bên catalog-service |
| RBAC admin / staff | Bảng `User` hiện chưa có cột `role` — cần migration |
| Email khi có đơn mới | Xem 1.3 |

**Xong khi:** nhân viên quản lý được toàn bộ vòng đời sản phẩm và đơn hàng mà
không cần vào database trực tiếp.

---

## 5. Phase 4 — Analytics real-time — **L**

| Việc |
|---|
| `services/analytics-service` thu thập event (page view, add-to-cart, purchase) |
| Kafka/Redpanda → ClickHouse |
| Dashboard doanh số, phễu chuyển đổi, dự báo tuần tới |
| Kubernetes + Terraform (theo CLAUDE.md, hạ tầng Phase 4+) |

**Xong khi:** chủ shop xem được doanh số thời gian thực và dự báo tuần tới với
sai số chấp nhận được.

---

## 6. Việc xuyên suốt

### 6.1 Bảo mật — **M**

- **Đơn hàng hiện ai cũng xem được nếu biết mã đơn.** `GET /orders/:orderNumber`
  không kiểm quyền. Mã có 6 ký tự ngẫu nhiên nên đoán không dễ, nhưng vẫn nên gắn
  đơn với phiên hoặc tài khoản trước khi mở public.
- Chưa có CSRF cho các route handler tự viết (`/api/cart/*`, `/api/checkout`).
  Auth.js tự lo phần của nó, phần còn lại thì chưa.
- Chưa có Content-Security-Policy.
- Rà lại toàn bộ log một lượt để chắc không có PII ở dạng thô.

### 6.2 Quan trắc — **S**

`SENTRY_DSN` và `POSTHOG_KEY` đã có trong `.env.example` nhưng **chưa nối vào
code ở đâu cả**. Cần nối Sentry cho cả ba service trước khi chạy thật.

### 6.3 Hiệu năng — **S**

- Đo tốc độ `pg_trgm` khi dữ liệu lớn hơn. CLAUDE.md nói chỉ thêm Meilisearch khi
  đo thấy chậm — **hãy đo trước, đừng thêm theo cảm tính**.
- Mọi trang catalog hiện là SSR không cache. Nếu chậm, cân nhắc cache ngắn ở
  tầng riêng thay vì quay lại ISR (lý do bỏ ISR ghi trong
  [architecture.md](architecture.md)).

### 6.4 Chất lượng kiểm thử — **M**

- order-service chưa có integration test nào (catalog-service có 12).
- Chưa có test cho luồng Stripe webhook.
- Chưa đo coverage; chưa đặt ngưỡng tối thiểu trong CI.

### 6.5 CI/CD — **S**

- `.github/workflows/deploy.yml` chưa tồn tại (CLAUDE.md có nhắc tới).
- CI chưa chạy e2e. Cần dựng cả ba service trong workflow mới chạy được.
- Chưa có Dependabot hay quét lỗ hổng phụ thuộc.

---

## 7. Thứ tự tôi khuyến nghị

1. **2.1** sửa `immutable_unaccent` — nhỏ nhưng chặn mọi việc deploy.
2. **2.2 → 2.5** đưa lên Railway, có link thật cho CV.
3. **1.1** đóng nốt thanh toán Stripe — để câu "thanh toán test qua Stripe" trong
   CV là sự thật kiểm chứng được.
4. **1.2** trừ tồn kho — lỗi đúng nghĩa, và là chi tiết mà người phỏng vấn kỹ
   tính sẽ hỏi.
5. **6.2** nối Sentry.
6. **Phase 2**, bắt đầu bằng `VectorStrategy`.

Ba việc đầu gộp lại khoảng 3–4 ngày, và sau đó dự án có một link demo chạy thật
với luồng mua hàng trọn vẹn — đủ để đứng trong CV mà không cần chú thích gì thêm.
