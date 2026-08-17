# Deploy để demo trên portfolio

Mục tiêu: một đường link mở ra là chạy, người xem bấm vào không phải chờ.

---

## 1. Chọn nền tảng

Dự án cần **3 tiến trình Node chạy liên tục + Postgres + Redis**. Điều đó loại
phần lớn lựa chọn "serverless miễn phí": storefront là SSR động, hai service
NestJS là server thường trú.

| | Railway | Vercel + Neon + Upstash + Render |
|---|---|---|
| Chi phí | ~5 $/tháng | 0 đ |
| Người xem bấm link | mở ngay | **chờ ~50 giây** (Render free ngủ sau 15 phút) |
| Số nơi phải cấu hình | 1 | 4 |
| Postgres có `pgvector` | có | Neon có |
| Redis | add-on sẵn | Upstash |

**Khuyến nghị: Railway.** Với portfolio, 5 $ đổi lấy việc link luôn mở tức thì là
đáng — người xem không chờ 50 giây, họ đóng tab. Phần còn lại của tài liệu này
theo Railway; các nền tảng khác dùng cùng bộ biến môi trường.

---

## 2. Chuẩn bị (đã làm sẵn trong repo)

Ba việc dưới đây đã xong, ghi lại để bạn biết vì sao chúng cần thiết:

- **`immutable_unaccent`** thay cho `ALTER FUNCTION unaccent(text) IMMUTABLE`.
  Lệnh cũ đòi quyền superuser và **bị từ chối trên mọi Postgres quản lý** —
  đã kiểm chứng: `ERROR: must be owner of function unaccent`.
- **`SET search_path TO catalog, public`** ở đầu migration. Postgres quản lý cài
  sẵn extension ở `public`, mà Prisma đặt `search_path` chỉ gồm `catalog`, nên
  `vector(1536)` không resolve được — đã kiểm chứng: `type "vector" does not exist`.
- **Dockerfile cho cả ba service** (`apps/storefront`, `services/catalog-service`,
  `services/order-service`), build từ **gốc monorepo**. Cả ba đã build và chạy
  thật, e2e xanh trên bộ container.

---

## 3. Các bước trên Railway

### 3.1 Tạo hạ tầng dữ liệu

1. Tạo project mới → **New → Database → PostgreSQL**.
2. Trong project đó → **New → Database → Redis**.
3. Mở Postgres → tab **Data** hoặc **Query**, chạy một lần:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS auth;
```

File [`infra/docker/postgres/init.sql`](../infra/docker/postgres/init.sql) chỉ
chạy cho container dev, Postgres quản lý không đọc nó — nên bước này phải làm tay.

### 3.2 Tạo ba service từ cùng một repo

Với mỗi service: **New → GitHub Repo → chọn repo này**, rồi vào Settings:

| Service | Dockerfile Path | Cổng |
|---|---|---|
| catalog | `services/catalog-service/Dockerfile` | 3001 |
| order | `services/order-service/Dockerfile` | 3002 |
| storefront | `apps/storefront/Dockerfile` | 3000 |

**Root Directory để trống** — Dockerfile được viết để build từ gốc monorepo, vì
mỗi service phụ thuộc `packages/` và `pnpm-lock.yaml` ở gốc.

### 3.3 Chạy migration và seed một lần

Sau khi ba service lên, mở shell của service catalog (Railway có nút
**Connect → Shell**) rồi chạy:

```bash
pnpm --filter catalog-service prisma:deploy
pnpm --filter order-service prisma:deploy
pnpm --filter @ecommerce/auth-db prisma:deploy

pnpm --filter catalog-service seed
pnpm --filter @ecommerce/auth-db seed
```

Không có shell thì tạm đổi lệnh khởi động thành `... prisma:deploy && node dist/main`
cho lần deploy đầu, xong đổi lại.

---

## 4. Biến môi trường — lấy giá trị ở đâu

### catalog-service

| Biến | Lấy ở đâu |
|---|---|
| `CATALOG_DATABASE_URL` | Railway Postgres → tab **Variables** → copy `DATABASE_URL`, **thêm đuôi** `?schema=catalog` |
| `AUTH_URL` | URL công khai của service storefront, ví dụ `https://storefront-production-xxxx.up.railway.app` |
| `CATALOG_SERVICE_PORT` | `3001` |

### order-service

| Biến | Lấy ở đâu |
|---|---|
| `ORDER_DATABASE_URL` | Cùng `DATABASE_URL` đó, đuôi `?schema=orders` |
| `REDIS_URL` | Railway Redis → **Variables** → copy `REDIS_URL` |
| `CATALOG_API_URL` | Địa chỉ nội bộ của catalog: Railway cho biến `${{catalog.RAILWAY_PRIVATE_DOMAIN}}`, dùng `http://${{catalog.RAILWAY_PRIVATE_DOMAIN}}:3001` |
| `AUTH_URL` | Giống hệt của catalog |
| `ORDER_SERVICE_PORT` | `3002` |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → **Developers → API keys** → *Secret key* ở chế độ **Test mode**. Bắt đầu bằng `sk_test_` |
| `STRIPE_WEBHOOK_SECRET` | dashboard.stripe.com → **Developers → Webhooks** → *Add endpoint* trỏ tới `https://<order-url>/payments/stripe/webhook`, chọn sự kiện `payment_intent.succeeded` và `payment_intent.payment_failed` → copy **Signing secret**, bắt đầu bằng `whsec_` |

### storefront

| Biến | Lấy ở đâu |
|---|---|
| `NEXT_PUBLIC_CATALOG_API_URL` | `http://${{catalog.RAILWAY_PRIVATE_DOMAIN}}:3001` |
| `NEXT_PUBLIC_ORDER_API_URL` | `http://${{order.RAILWAY_PRIVATE_DOMAIN}}:3002` |
| `AUTH_DATABASE_URL` | Cùng `DATABASE_URL` đó, đuôi `?schema=auth` |
| `AUTH_URL` | Chính URL công khai của storefront |
| `AUTH_SECRET` | Tự sinh: `openssl rand -base64 32` (hoặc `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`). **Không dùng lại giá trị trong `.env` ở máy bạn** |
| `PORT` | `3000` |

Ba lưu ý dễ sai:

- **`AUTH_URL` phải giống hệt nhau ở cả ba service** và bằng đúng domain
  storefront. Hai service NestJS dùng nó làm origin CORS; lệch một ký tự, kể cả
  dấu `/` thừa ở cuối, là trình duyệt chặn.
- **`NEXT_PUBLIC_*` ở đây thực ra chỉ dùng phía server** (route handler và server
  component), nên điền địa chỉ **nội bộ** của service là đúng. Tên biến mang tiền
  tố `NEXT_PUBLIC_` là do quy ước cũ, không có nghĩa trình duyệt gọi thẳng.
- **Đuôi `?schema=...` là bắt buộc.** Ba service dùng chung một database nhưng ba
  schema riêng; thiếu đuôi thì cả ba ghi đè lên nhau ở `public`.

### Biến chưa cần cho Phase 1

`LLM_PROVIDER`, `LLM_API_KEY`, `EMBEDDING_MODEL` (Phase 2), `MEILISEARCH_*`
(chỉ thêm khi đo thấy `pg_trgm` chậm), `SENTRY_DSN`, `POSTHOG_KEY`
(chưa nối vào code).

---

## 5. Kiểm chứng sau khi deploy

```bash
curl https://<catalog-url>/health
curl https://<order-url>/health
curl "https://<catalog-url>/search?q=ao+thunn"      # phải ra "Áo thun nam cotton"
```

Rồi mở storefront và đi hết một vòng: gõ sai chính tả → mở sản phẩm → thêm giỏ →
thanh toán bằng thẻ test `4242 4242 4242 4242` → xem trang xác nhận.

Chạy được cả bộ e2e trên môi trường đã deploy:

```bash
E2E_BASE_URL=https://<storefront-url> pnpm --filter e2e exec playwright test
```

---

## 6. Nên làm trước khi đưa link vào portfolio

- **Đặt lại seed theo lịch** (Railway có cron): khách vọc xong dữ liệu sẽ lộn xộn.
- **Chặn lập chỉ mục**: thêm `robots.txt` chặn, để demo không lẫn vào kết quả tìm
  kiếm như một cửa hàng thật.
- **Siết rate limit**: hiện 60 lần/phút cho `/search`, 120 cho `/suggest`.
- **Ghi rõ đây là demo** ở footer, kèm tài khoản dùng thử `demo@chongoc.vn` /
  `demo12345` để người xem đăng nhập ngay được.
- **Nối Sentry** (`SENTRY_DSN` đã có sẵn trong `.env.example` nhưng chưa nối vào
  code) để biết khi demo hỏng.

## 7. Điểm còn yếu, nên biết trước khi bị hỏi

Người xem kỹ tính sẽ tìm ra, nên tốt hơn là bạn nói trước:

- **Image Docker khoảng 1,4 GB** vì copy cả cây monorepo đã build. Đổi lại là
  không phải đoán chỗ nằm của Prisma query engine và các symlink pnpm. Giảm được
  bằng `pnpm deploy --filter` nhưng cần thêm công.
- **Chưa trừ tồn kho khi đặt hàng**, mới chỉ kiểm tra — xem
  [roadmap-to-completion.md](roadmap-to-completion.md) mục 1.2.
- **`GET /orders/:orderNumber` chưa kiểm quyền**: ai biết mã đơn đều xem được.
