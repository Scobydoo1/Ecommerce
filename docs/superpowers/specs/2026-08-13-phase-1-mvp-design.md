# Phase 1 — MVP: Storefront + Smart Search (Design)

Ngày: 2026-08-13
Trạng thái: đã duyệt
Nguồn ràng buộc: `CLAUDE.md` mục 6 (Phase 1) và mục 10 (thứ tự file)

## 1. Mục tiêu

Một web bán hàng chạy được thật: khách tìm được sản phẩm kể cả khi gõ sai chính tả hoặc thiếu dấu, xem chi tiết, thêm giỏ hàng, thanh toán test qua Stripe và nhận xác nhận đơn.

Ngoài phạm vi Phase 1: chatbot RAG, admin dashboard, analytics, Kubernetes, ClickHouse, Kafka.

## 2. Quyết định kiến trúc đã chốt

| # | Vấn đề CLAUDE.md bỏ ngỏ | Quyết định | Lý do |
|---|---|---|---|
| AD-1 | Ai sinh embedding ở Phase 1, khi `ai-service` thuộc Phase 2 | Dựng sẵn `SearchStrategy` + RRF, Phase 1 chỉ bật `TrigramStrategy`. Cột `embedding vector(1536)` và index HNSW tạo ngay trong migration đầu, để NULL | Không cần `LLM_API_KEY` để chạy dev/test, không lấn service boundary của Phase 2. Phase 2 chỉ cắm thêm `VectorStrategy` |
| AD-2 | Một `DATABASE_URL` nhưng hai `schema.prisma` | Một database `ecommerce`, tách theo Postgres schema: `catalog`, `orders`, `auth` | Mỗi service giữ migration history riêng, không giẫm chân nhau; dev chỉ cần một container Postgres |
| AD-3 | Auth khách hàng đặt ở đâu (không có auth-service) | Auth.js v5 trong `apps/storefront`, bảng ở schema `auth`, service backend verify JWT bằng `AUTH_SECRET` | Đúng folder structure sẵn có (`lib/auth.ts`), không đẻ service ngoài kế hoạch |
| AD-4 | "test container, không mock DB" cụ thể là gì | `@testcontainers/postgresql` + image `pgvector/pgvector:pg16` | Mục 7 yêu cầu trực tiếp; test cô lập, chạy được cả local lẫn CI |

Package thêm ngoài mục 3, kèm lý do bắt buộc phải nêu theo mục 2 của CLAUDE.md:

- `@testcontainers/postgresql` — mục 7 yêu cầu integration test dùng test container.
- `@nestjs/throttler` — mục 8 yêu cầu rate limiting cho API search.
- `next-auth@5` (Auth.js) — Phase 1 yêu cầu auth cơ bản cho khách hàng.

## 3. Topology

| Thành phần | Port | Ghi chú |
|---|---|---|
| `apps/storefront` (Next.js 14 App Router) | 3000 | SSR cho SEO; gọi service qua `lib/api-client.ts`; `app/api/*` chỉ proxy khi cần cookie phía browser |
| `services/catalog-service` (NestJS) | 3001 | Prisma → schema `catalog` |
| `services/order-service` (NestJS) | 3002 | Prisma → schema `orders`; giỏ hàng ở Redis |
| Postgres 16 — image `pgvector/pgvector:pg16` | 5432 | extensions `pg_trgm`, `unaccent`, `vector` |
| Redis 7 | 6379 | session cart, cache |

Không dựng Meilisearch ở Phase 1. CLAUDE.md chỉ cho thêm nếu `pg_trgm` không đủ nhanh — đo p95 của `/search` ở cuối Phase 1 rồi mới quyết.

Không tạo `packages/ui` ở Phase 1 vì chưa có component nào thật sự dùng chung (`apps/admin` là Phase 3). Chỉ tạo `packages/config` và `packages/types`.

## 4. Data model

### schema `catalog`

- `Category(id, name, slug unique, parentId nullable, createdAt, updatedAt)`
- `Product(id, sku unique, name, slug unique, description, priceCents int, currency, stock int, status enum(DRAFT|ACTIVE|ARCHIVED), categoryId, embedding vector(1536) nullable, createdAt, updatedAt)`
- `ProductImage(id, productId, url, alt, position)`

Index: GIN trigram trên `name` và `description`, HNSW trên `embedding`, btree trên `slug`, `categoryId`, `status`.

### schema `orders`

- `Order(id, orderNumber unique, userId nullable, email, status enum(PENDING|PAID|FAILED|CANCELLED), subtotalCents, totalCents, currency, stripePaymentIntentId nullable, createdAt, updatedAt)`
- `OrderItem(id, orderId, productId, nameSnapshot, unitPriceCents, quantity)`

`nameSnapshot` và `unitPriceCents` là bản chụp tại thời điểm đặt — đơn hàng cũ không đổi khi sản phẩm đổi giá.

### schema `auth`

Bảng chuẩn của Auth.js: `User`, `Account`, `Session`, `VerificationToken`. Password lưu bằng bcrypt, không bao giờ log.

### Redis

`cart:{sessionId}` → JSON `{ items: [{ productId, quantity }], updatedAt }`, TTL 30 ngày. Giỏ hàng không vào Postgres ở Phase 1.

### Quy ước tiền tệ

Mọi số tiền là **integer cents**, không dùng float ở bất kỳ tầng nào.

## 5. Search design

`SearchService` nhận một danh sách `SearchStrategy` và hợp nhất kết quả bằng Reciprocal Rank Fusion:

```
score(doc) = Σ_strategies 1 / (k + rank_strategy(doc)),  k = 60
```

Phase 1 đăng ký đúng một strategy: `TrigramStrategy`. Phase 2 thêm `VectorStrategy` mà không sửa `SearchService`.

Ba đơn vị logic thuần, test được không cần database — đây là phần bắt buộc viết test trước:

1. `normalizeQuery(raw)` — trim, gộp khoảng trắng, lowercase, bỏ dấu tiếng Việt. `"áo thun"`, `"ao thun"`, `"aó  Thun "` phải cho cùng một chuỗi chuẩn hóa.
2. `fuseResults(rankedLists, k)` — RRF. Phải ổn định khi một id xuất hiện ở nhiều list, và tất định khi score bằng nhau (tie-break theo id).
3. `TrigramStrategy.buildQuery()` — `similarity()` trên `unaccent(name)` và `unaccent(description)`, ngưỡng 0.15, cộng điểm khi khớp prefix, luôn lọc `status = 'ACTIVE'`.

Endpoint:

- `GET /search?q&limit&offset&categoryId` — kết quả đầy đủ, có phân trang.
- `GET /search/suggest?q` — autocomplete, tối đa 8 kết quả, chỉ trả `name` + `slug`.

Cả hai bọc `@nestjs/throttler` theo mục 8.

## 6. Testing

- **Unit (Jest)**: `normalizeQuery`, `fuseResults`, `TrigramStrategy.buildQuery`, `ProductsService` (sinh slug, chống trùng SKU, validate stock/giá âm), `CartService` (gộp quantity cùng sản phẩm, tính subtotal, chặn vượt tồn kho). Viết test trước implementation.
- **Integration (Testcontainers)**: `products.controller` CRUD và `search.controller` với dữ liệu seed thật. Có case khẳng định gõ sai chính tả và thiếu dấu vẫn ra đúng sản phẩm.
- **E2E (Playwright)**: tìm kiếm → chi tiết → thêm giỏ → thanh toán Stripe test → trang xác nhận.
- Stripe được mock ở unit và integration; chỉ e2e mới chạm Stripe test mode, và chỉ khi có key.

## 7. Bảo mật

- Không hardcode secret, tất cả qua `.env`; `.env` nằm trong `.gitignore`.
- `class-validator` + `ValidationPipe(whitelist: true)` ở mọi endpoint NestJS.
- Rate limit `/search`, `/search/suggest`.
- Không lưu thông tin thẻ — chỉ giữ `stripePaymentIntentId`.
- Logger loại bỏ email, số điện thoại, và toàn bộ payload thanh toán.

## 8. Thứ tự thực thi

Bám đúng mục 10 của CLAUDE.md. Mỗi mốc là một commit Conventional Commits, chạy `lint` + `test` trước khi đóng mốc.

| Mốc | Nội dung | Mục 10 |
|---|---|---|
| M0 | Khung monorepo: `pnpm-workspace.yaml`, `turbo.json`, root `package.json`, `packages/config`, `packages/types`, `.env.example`, `.gitignore` | 1, 2 |
| M1 | `infra/docker/docker-compose.yml` — Postgres pgvector + Redis, init extensions | 3 |
| M2 | `catalog-service` khung NestJS + `schema.prisma` + migration đầu | 4 |
| M3 | CRUD sản phẩm + danh mục (TDD) | 5 |
| M4 | Search service: `normalizeQuery`, `fuseResults`, `TrigramStrategy`, `/search`, `/search/suggest` (TDD) | 6 |
| M5 | `storefront`: layout, trang chủ, trang danh mục | 7 |
| M6 | Search bar autocomplete + trang kết quả tìm kiếm | 8 |
| M7 | Trang chi tiết sản phẩm | 9 |
| M8 | `order-service`: schema `Order`/`OrderItem` + giỏ hàng Redis (TDD) | 10 |
| M9 | Stripe test mode + webhook + trang xác nhận đơn | 11 |
| M10 | Auth.js cho khách hàng | — |
| M11 | `.github/workflows/ci.yml` — lint + test trên mọi PR | 12 |
| M12 | `docs/architecture.md`, `docs/setup.md`, e2e Playwright | 13, 14 |

## 9. Definition of Done

Người dùng tìm được sản phẩm kể cả khi gõ gần đúng, sai chính tả hoặc thiếu dấu tiếng Việt; xem được chi tiết; thêm được vào giỏ; thanh toán test qua Stripe; và nhận được xác nhận đơn hàng. `pnpm lint` và `pnpm test` xanh trên toàn monorepo, CI chạy tự động trên mọi PR.
