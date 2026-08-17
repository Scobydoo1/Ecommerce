# Deploy miễn phí để demo trên portfolio

Hướng dẫn từng bước, dùng **hoàn toàn dịch vụ miễn phí**. Làm tuần tự từ mục 1
đến mục 7, khoảng 45–60 phút cho lần đầu.

---

## 1. Stack và điều bạn phải chấp nhận

| Thành phần | Dịch vụ | Gói |
|---|---|---|
| storefront, catalog-service, order-service | **Render** (Docker) | Free |
| PostgreSQL 16 + pgvector | **Neon** | Free, 0,5 GB |
| Redis | **Upstash** | Free, 10.000 lệnh/ngày |

**Đánh đổi bạn cần biết trước:** service free của Render **ngủ sau 15 phút không
ai truy cập**. Lần bấm đầu tiên sau khi ngủ mất **khoảng 50 giây**. Mục 6 có cách
giảm nhẹ, nhưng không xoá được hoàn toàn trong giới hạn miễn phí — Render chỉ cho
750 giờ chạy/tháng cho cả workspace, mà giữ 3 service thức 24/7 cần 2.190 giờ.

Nếu sau này chấp nhận trả ~5 $/tháng thì Railway chạy cả 5 thành phần không ngủ,
dùng đúng bộ biến môi trường ở mục 5.

Tại sao dùng Docker trên Render thay vì build Node thường: repo là monorepo pnpm,
mỗi service phụ thuộc `packages/` ở gốc. Ba Dockerfile trong repo đã xử lý việc
đó và **đã được build, chạy thật, e2e xanh trên bộ container**.

---

## 2. Tạo database trên Neon

1. Vào **neon.tech** → đăng ký bằng tài khoản GitHub → **Create project**.
2. Đặt tên project, chọn **Postgres 16**, chọn region gần bạn nhất
   (Singapore nếu ở Việt Nam).
3. Sau khi tạo xong, vào tab **SQL Editor** và chạy nguyên khối này:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS auth;
```

File [`infra/docker/postgres/init.sql`](../infra/docker/postgres/init.sql) chỉ
chạy cho container dev ở máy bạn; Neon không đọc nó nên bước này **bắt buộc làm tay**.

4. Vào **Dashboard → Connection string**, chọn dạng **psql / URI**, copy chuỗi.
   Nó trông như thế này:

```
postgresql://ten_user:mat_khau@ep-abc-123.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Giữ chuỗi này lại, mục 5 sẽ dùng. Gọi nó là `<NEON_URL>`.

---

## 3. Tạo Redis trên Upstash

1. Vào **upstash.com** → đăng ký → **Create Database** → chọn **Redis**.
2. Chọn region gần bạn, gói **Free**.
3. Vào tab **Details**, tìm mục **Endpoints**, copy chuỗi dạng
   `rediss://default:<mat_khau>@<host>.upstash.io:6379`.

Lưu ý chữ **`rediss://`** hai chữ `s` — đó là bản có TLS, bắt buộc với Upstash.
Thư viện `ioredis` tự bật TLS khi thấy tiền tố này.

Giữ chuỗi này lại, gọi là `<UPSTASH_URL>`.

---

## 4. Nạp schema và dữ liệu — chạy từ máy bạn

Render free **không cho mở shell**, nên migration và seed phải chạy từ máy bạn
trỏ thẳng vào Neon. Neon mở ra Internet nên việc này làm được.

Mở terminal ở thư mục dự án:

```bash
# Thay <NEON_URL> bằng chuỗi lấy ở mục 2. Chú ý phần ?schema=... ở cuối:
# ba service dùng chung một database nhưng ba schema riêng, thiếu đuôi này là
# cả ba ghi đè lên nhau.

CATALOG_DATABASE_URL="<NEON_URL>&schema=catalog" \
  pnpm --filter catalog-service exec prisma migrate deploy

ORDER_DATABASE_URL="<NEON_URL>&schema=orders" \
  pnpm --filter order-service exec prisma migrate deploy

AUTH_DATABASE_URL="<NEON_URL>&schema=auth" \
  pnpm --filter @ecommerce/auth-db exec prisma migrate deploy
```

Chuỗi Neon đã có sẵn `?sslmode=require` nên nối thêm bằng **`&schema=`**, không
phải `?schema=`.

Nạp dữ liệu mẫu:

```bash
CATALOG_DATABASE_URL="<NEON_URL>&schema=catalog" \
  pnpm --filter catalog-service exec ts-node prisma/seed.ts

AUTH_DATABASE_URL="<NEON_URL>&schema=auth" \
  pnpm --filter @ecommerce/auth-db exec ts-node prisma/seed.ts
```

Dữ liệu mẫu có sẵn trong repo:

| Thứ | Số lượng | Chi tiết |
|---|---|---|
| Danh mục | 6 | Thời trang nam/nữ, Đồ điện tử, Giày dép, Nhà cửa, Sách & VPP |
| Sản phẩm | 42 | Tên tiếng Việt có dấu, mô tả thật, giá và tồn kho khác nhau |
| — đang bán | 40 | trong đó **4 món hết hàng** để thấy nhãn "Hết hàng" |
| — ẩn | 2 | 1 DRAFT + 1 ARCHIVED, chứng minh bộ lọc trạng thái hoạt động |
| Tài khoản | 3 | `demo@chongoc.vn` / `demo12345` và hai tài khoản nữa |

Kiểm tra ngay rằng dữ liệu đã vào:

```bash
CATALOG_DATABASE_URL="<NEON_URL>&schema=catalog" \
  pnpm --filter catalog-service exec prisma studio
```

---

## 5. Tạo ba service trên Render

Vào **render.com** → đăng ký bằng GitHub → cho phép truy cập repo `Ecommerce`.

Với **mỗi** service: **New → Web Service → Build and deploy from a Git
repository** → chọn repo. Rồi điền theo bảng:

| | catalog | order | storefront |
|---|---|---|---|
| Name | `chongoc-catalog` | `chongoc-order` | `chongoc-storefront` |
| Language | **Docker** | **Docker** | **Docker** |
| Dockerfile Path | `services/catalog-service/Dockerfile` | `services/order-service/Dockerfile` | `apps/storefront/Dockerfile` |
| Docker Build Context Directory | `.` | `.` | `.` |
| Instance Type | Free | Free | Free |

**Docker Build Context phải là `.` (gốc repo)**, không phải thư mục service —
Dockerfile được viết để build từ gốc vì mỗi service cần `packages/` và
`pnpm-lock.yaml` ở đó.

**Không cần đặt cổng.** Render tiêm biến `PORT` và cả ba service đã được sửa để
ưu tiên đọc biến đó.

### Thứ tự tạo

Tạo **catalog trước**, đợi nó deploy xong và copy URL công khai
(dạng `https://chongoc-catalog.onrender.com`), rồi mới tạo order và storefront —
vì hai cái sau cần URL của catalog.

### Biến môi trường — điền vào tab Environment của từng service

**chongoc-catalog**

| Biến | Giá trị | Lấy ở đâu |
|---|---|---|
| `CATALOG_DATABASE_URL` | `<NEON_URL>&schema=catalog` | Mục 2 |
| `AUTH_URL` | `https://chongoc-storefront.onrender.com` | URL storefront (đoán trước theo tên bạn đặt, hoặc quay lại điền sau) |

**chongoc-order**

| Biến | Giá trị | Lấy ở đâu |
|---|---|---|
| `ORDER_DATABASE_URL` | `<NEON_URL>&schema=orders` | Mục 2 |
| `REDIS_URL` | `<UPSTASH_URL>` | Mục 3 |
| `CATALOG_API_URL` | `https://chongoc-catalog.onrender.com` | URL service catalog |
| `AUTH_URL` | `https://chongoc-storefront.onrender.com` | Giống hệt của catalog |
| `STRIPE_SECRET_KEY` | *(để trống lúc đầu)* | Mục 7 |
| `STRIPE_WEBHOOK_SECRET` | *(để trống lúc đầu)* | Mục 7 |

**chongoc-storefront**

| Biến | Giá trị | Lấy ở đâu |
|---|---|---|
| `NEXT_PUBLIC_CATALOG_API_URL` | `https://chongoc-catalog.onrender.com` | URL service catalog |
| `NEXT_PUBLIC_ORDER_API_URL` | `https://chongoc-order.onrender.com` | URL service order |
| `AUTH_DATABASE_URL` | `<NEON_URL>&schema=auth` | Mục 2 |
| `AUTH_URL` | `https://chongoc-storefront.onrender.com` | Chính URL của nó |
| `AUTH_SECRET` | chuỗi ngẫu nhiên 32 byte | Sinh bằng lệnh dưới |

Sinh `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Đừng dùng lại giá trị đang có trong `.env` ở máy bạn** — nó đã nằm trong log
terminal và không còn kín nữa.

### Ba chỗ dễ sai nhất

1. **`AUTH_URL` phải giống hệt nhau ở cả ba service**, và bằng đúng domain
   storefront. Hai service NestJS dùng nó làm origin CORS. Thừa một dấu `/` ở
   cuối là trình duyệt chặn hết, mà thông báo lỗi sẽ rất khó hiểu.
2. **Đuôi `&schema=...` không được thiếu.** Thiếu là ba service cùng ghi vào
   `public` và giẫm lên nhau.
3. **`NEXT_PUBLIC_*` ở dự án này thực ra chỉ dùng phía server** (route handler và
   server component), nên điền URL công khai của service là đúng. Tiền tố
   `NEXT_PUBLIC_` chỉ là tên biến, không có nghĩa trình duyệt gọi thẳng.

---

## 6. Giảm nhẹ chuyện service ngủ

Render free ngủ sau 15 phút. Bạn có 750 giờ chạy/tháng cho cả workspace, mà giữ
3 service thức 24/7 cần 2.190 giờ — nên **không thể giữ thức cả tháng**.

Cách dùng hết ngân sách đó cho hợp lý: chỉ đánh thức trong giờ người ta hay xem
CV. Thêm file `.github/workflows/keep-warm.yml`:

```yaml
name: Keep demo warm

on:
  schedule:
    # 9h-18h giờ Việt Nam (UTC+7) = 2h-11h UTC, các ngày trong tuần.
    - cron: '*/10 2-11 * * 1-5'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -sS -o /dev/null -w 'catalog %{http_code}\n' https://chongoc-catalog.onrender.com/health
          curl -sS -o /dev/null -w 'order %{http_code}\n' https://chongoc-order.onrender.com/health
          curl -sS -o /dev/null -w 'storefront %{http_code}\n' https://chongoc-storefront.onrender.com/
```

Tính ra: 9 giờ × 22 ngày × 3 service ≈ 594 giờ, nằm dưới hạn mức 750.

Ngoài khung giờ đó, lần bấm đầu vẫn mất ~50 giây. **Hãy ghi thẳng điều này cạnh
link trong portfolio** — người xem biết trước sẽ chờ; không biết thì họ tưởng
trang hỏng và đóng tab:

> Demo chạy trên hạ tầng miễn phí, lần truy cập đầu tiên có thể mất ~50 giây để
> server khởi động.

---

## 7. Bật thanh toán Stripe (tuỳ chọn)

Thiếu khoá Stripe thì đơn hàng vẫn tạo được và dừng ở trạng thái `PENDING` —
luồng mua hàng chạy trọn, chỉ không có bước quẹt thẻ.

Muốn bật đầy đủ:

1. Vào **dashboard.stripe.com**, bật **Test mode** (công tắc góc phải trên).
2. **Developers → API keys** → copy **Secret key** (bắt đầu bằng `sk_test_`) →
   điền vào `STRIPE_SECRET_KEY` của service order.
3. **Developers → Webhooks → Add endpoint**:
   - URL: `https://chongoc-order.onrender.com/payments/stripe/webhook`
   - Events: `payment_intent.succeeded` và `payment_intent.payment_failed`
4. Copy **Signing secret** (bắt đầu bằng `whsec_`) → điền vào
   `STRIPE_WEBHOOK_SECRET`.

Phần giao diện quẹt thẻ **chưa được viết** — xem
[roadmap-to-completion.md](roadmap-to-completion.md) mục 1.1.

---

## 8. Kiểm chứng sau khi deploy

```bash
curl https://chongoc-catalog.onrender.com/health
curl https://chongoc-order.onrender.com/health

# Gõ sai chính tả vẫn phải ra đúng sản phẩm:
curl "https://chongoc-catalog.onrender.com/search?q=ao+thunn"
```

Lần đầu chạy có thể mất ~50 giây vì service đang ngủ. Nếu trả về
`Áo thun nam cotton` là toàn bộ chuỗi storefront → catalog → Neon đã thông.

Rồi mở storefront và đi hết một vòng: gõ `ao thunn` → mở sản phẩm → thêm giỏ →
thanh toán → xem trang xác nhận. Đăng nhập thử bằng `demo@chongoc.vn` / `demo12345`.

Chạy được cả bộ e2e trên môi trường thật:

```bash
E2E_BASE_URL=https://chongoc-storefront.onrender.com \
  pnpm --filter e2e exec playwright test
```

---

## 9. Trước khi đưa link vào portfolio

- **Ghi rõ đây là demo** và cảnh báo 50 giây khởi động, kèm tài khoản dùng thử.
- **Đặt lại seed định kỳ**: khách vọc xong dữ liệu sẽ lộn xộn. Chạy lại hai lệnh
  seed ở mục 4 khi cần — chúng dùng `upsert` nên chạy nhiều lần vẫn an toàn.
- **Chèn ảnh chụp màn hình vào README**: nhiều người xem ảnh rồi mới quyết định
  có bấm link hay không.
- **Điểm yếu nên biết trước khi bị hỏi:** chưa trừ tồn kho khi đặt hàng, và
  `GET /orders/:orderNumber` chưa kiểm quyền. Cả hai ghi trong
  [roadmap-to-completion.md](roadmap-to-completion.md).
