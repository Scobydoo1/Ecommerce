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
| `infra/docker` | Postgres (pgvector) + Redis cho dev | 1 |

## Bat dau nhanh

```bash
pnpm install
cp .env.example .env
pnpm db:up          # Postgres + Redis
pnpm dev
```

Chi tiet xem [docs/setup.md](docs/setup.md). Kien truc va cac quyet dinh xem
[docs/architecture.md](docs/architecture.md) va
[spec Phase 1](docs/superpowers/specs/2026-08-13-phase-1-mvp-design.md).

## Lenh thuong dung

```bash
pnpm lint          # ESLint toan monorepo
pnpm test          # Unit test toan monorepo
pnpm test:integration   # Integration test (can Docker)
pnpm build
```
