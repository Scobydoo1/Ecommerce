# Cài đặt và chạy

## Yêu cầu

| Thứ | Bản | Ghi chú |
|---|---|---|
| Node.js | ≥ 22.13 | pnpm 11 yêu cầu mức này. Đã kiểm trên 24.14 |
| pnpm | 11.x | Xem lưu ý bên dưới nếu `corepack` bị chặn |
| Docker | bất kỳ bản còn hỗ trợ | Chạy Postgres + Redis, và Testcontainers cho integration test |

### pnpm trên Windows

`corepack enable pnpm` ghi vào `C:\Program Files\nodejs` nên thường thất bại với
`EPERM` nếu shell không chạy quyền quản trị. Dùng cách này thay thế:

```bash
npm i -g pnpm
```

## Dựng môi trường

```bash
pnpm install
cp .env.example .env

pnpm db:up                                    # Postgres (pgvector) + Redis

pnpm --filter catalog-service prisma:generate
pnpm --filter order-service prisma:generate
pnpm --filter @ecommerce/auth-db prisma:generate

pnpm --filter catalog-service prisma:deploy
pnpm --filter order-service prisma:deploy
pnpm --filter @ecommerce/auth-db prisma:deploy

pnpm --filter catalog-service seed             # 6 danh mục, 42 sản phẩm tiếng Việt
pnpm --filter @ecommerce/auth-db seed          # 3 tài khoản demo
```

Ba lệnh `prisma:generate` là bắt buộc sau mỗi lần clone mới: client sinh ra
không được commit.

## Chạy

```bash
pnpm dev
```

| Dịch vụ | Cổng | Kiểm tra nhanh |
|---|---|---|
| storefront | 3000 | http://localhost:3000 |
| catalog-service | 3001 | `curl http://localhost:3001/health` |
| order-service | 3002 | `curl http://localhost:3002/health` |

### Nếu cổng 3000 đã bị chiếm

Đặt `PORT` trong `.env` (ví dụ `PORT=3100`) và **đổi `AUTH_URL` theo cùng cổng** —
cả hai service NestJS dùng `AUTH_URL` làm origin cho CORS, lệch cổng thì trình
duyệt sẽ bị chặn.

## Kiểm chứng nhanh rằng tìm kiếm mờ hoạt động

```bash
curl "http://localhost:3001/search?q=ao+thunn"
```

Phải trả về "Áo thun nam cotton" — gõ thiếu dấu *và* thừa một chữ `n` vẫn ra
đúng sản phẩm.

## Test

```bash
pnpm lint
pnpm typecheck
pnpm test                  # unit, không cần Docker
pnpm test:integration      # Testcontainers, cần Docker đang chạy
pnpm test:e2e              # Playwright, cần cả 3 service đang chạy
```

## Biến môi trường

Xem `.env.example`. Những biến thật sự cần cho Phase 1:

| Biến | Bắt buộc | Vai trò |
|---|---|---|
| `CATALOG_DATABASE_URL` | có | Postgres schema `catalog` |
| `ORDER_DATABASE_URL` | có | Postgres schema `orders` |
| `AUTH_DATABASE_URL` | có | Postgres schema `auth` |
| `REDIS_URL` | có | Giỏ hàng theo phiên |
| `CATALOG_API_URL` | có | order-service hỏi giá và tồn kho |
| `AUTH_SECRET` | có | Ký phiên JWT. Sinh bằng `openssl rand -base64 32` |
| `AUTH_URL` | có | Origin CORS của hai service |
| `STRIPE_SECRET_KEY` | không | Thiếu thì thanh toán tắt, đơn dừng ở `PENDING` |
| `STRIPE_WEBHOOK_SECRET` | không | Cần nếu muốn nhận webhook |
| `LLM_API_KEY`, `MEILISEARCH_*` | không | Dành cho Phase 2 trở đi |

Không commit `.env`. Chỉ `.env.example` được commit.

## Bẫy đã gặp

- **Không đặt `incremental: true`** trong tsconfig của service NestJS. File
  `tsbuildinfo` nằm ngoài `outDir`, mà `nest build` xoá `dist` chứ không xoá nó,
  khiến lần build sau báo thành công nhưng không emit gì.
- **Prisma client của order-service và của `@ecommerce/auth-db` có output riêng.**
  catalog-service dùng đường mặc định trong gói `@prisma/client` dùng chung; nếu
  hai chỗ kia cũng để mặc định thì lần `generate` sau đè lên client của chỗ trước.
- **Truy cập schema `auth` nằm ở `packages/auth-db`, không nằm trong app Next.**
  Prisma client sinh bên trong thư mục app khiến webpack của Next quét tìm query
  engine và đâm vào junction trong profile Windows (`C:\Users\<tên>\Application Data`)
  rồi ném `EPERM`.
- **Script `dev`/`build`/`start` của storefront bọc qua `dotenv -e ../../.env`.**
  Next chỉ đọc `.env` trong thư mục app chứ không đọc `.env` gốc monorepo như
  `@nestjs/config` vẫn làm.
- **Khi kiểm thử bằng dòng lệnh trên Windows, đừng gõ tiếng Việt có dấu thẳng vào
  `curl -d`.** Shell làm méo UTF-8 trước khi request rời máy. Ghi body ra file rồi
  `curl --data-binary @file`.
