# AI-Native E-commerce Platform

Monorepo cho nen tang thuong mai dien tu 4 lop mo ta trong [CLAUDE.md](CLAUDE.md).

**Trang thai hien tai: Phase 1 - MVP Storefront + Smart Search.**

## Cau truc

| Duong dan | Vai tro | Phase |
|---|---|---|
| `apps/storefront` | Next.js 14, web ban hang cho khach | 1 |
| `services/catalog-service` | NestJS, san pham + tim kiem (pg_trgm) | 1 |
| `services/order-service` | NestJS, gio hang + don hang + Stripe | 1 |
| `packages/config` | tsconfig / eslint dung chung | 1 |
| `packages/types` | DTO TypeScript dung chung | 1 |
| `packages/auth-db` | Prisma client cho schema `auth` | 1 |
| `infra/docker` | Postgres (pgvector) + Redis cho dev | 1 |
| `tests/e2e` | Playwright, luong mua hang dau-cuoi | 1 |

## Bat dau nhanh

```bash
pnpm install
cp .env.example .env
pnpm db:up                                      # Postgres + Redis

pnpm --filter catalog-service prisma:generate   # client sinh ra khong duoc commit
pnpm --filter order-service prisma:generate
pnpm --filter @ecommerce/auth-db prisma:generate

pnpm --filter catalog-service prisma:deploy
pnpm --filter order-service prisma:deploy
pnpm --filter @ecommerce/auth-db prisma:deploy
pnpm --filter catalog-service seed              # 3 danh muc, 9 san pham

pnpm dev
```

Kiem chung nhanh rang tim kiem mo hoat dong:

```bash
curl "http://localhost:3001/search?q=ao+thunn"   # -> "Áo thun nam cotton"
```

Chi tiet xem [docs/setup.md](docs/setup.md). Kien truc va cac quyet dinh xem
[docs/architecture.md](docs/architecture.md) va
[spec Phase 1](docs/superpowers/specs/2026-08-13-phase-1-mvp-design.md).

## Lenh thuong dung

```bash
pnpm lint               # ESLint toan monorepo
pnpm typecheck
pnpm test               # Unit test toan monorepo
pnpm test:integration   # Integration test (Testcontainers, can Docker)
pnpm test:e2e           # Playwright, can ca 3 service dang chay
pnpm build
```

## Trang thai Phase 1

| Hang muc | Trang thai |
|---|---|
| Monorepo, docker-compose | xong |
| catalog-service: CRUD + tim kiem mo | xong |
| storefront: chu, danh muc, chi tiet, tim kiem goi y | xong |
| Gio hang Redis theo phien | xong |
| Don hang + trang xac nhan | xong |
| Auth khach hang (Auth.js) | xong |
| CI lint + typecheck + test | xong |
| Thanh toan the qua Stripe | code xong, **chua kiem chung** vi may dev chua co khoa test |

Cac gioi han da biet cua Phase 1 (chua tru ton kho, chua gui email) duoc liet ke
trong [docs/architecture.md](docs/architecture.md).
