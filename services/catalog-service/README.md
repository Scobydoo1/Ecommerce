# catalog-service

NestJS service so huu san pham, danh muc va toan bo logic tim kiem.
Chay tren cong `3001`. Du lieu nam trong Postgres schema `catalog` (xem AD-2
trong [spec Phase 1](../../docs/superpowers/specs/2026-08-13-phase-1-mvp-design.md)).

## Chay

```bash
pnpm --filter catalog-service prisma:generate
pnpm --filter catalog-service prisma:deploy
pnpm --filter catalog-service dev
```

Yeu cau Postgres dang chay: `pnpm db:up` tu goc monorepo.

## Bien moi truong

| Bien | Y nghia |
|---|---|
| `CATALOG_DATABASE_URL` | Connection string tro vao schema `catalog` |
| `CATALOG_SERVICE_PORT` | Mac dinh `3001` |
| `AUTH_URL` | Origin duoc phep goi CORS, mac dinh `http://localhost:3000` |

## Tim kiem hoat dong the nao

`SearchService` nhan mot danh sach `SearchStrategy` va hop nhat ket qua bang
Reciprocal Rank Fusion (`score = sum 1/(k + rank)`, `k = 60`).

Phase 1 dang ky dung mot strategy: `TrigramStrategy`, dua tren `pg_trgm` va
`unaccent` nen go thieu dau hoac sai chinh ta van ra dung san pham.
Cot `embedding vector(1536)` va index HNSW da duoc tao san trong migration dau
nhung luon NULL o Phase 1 - Phase 2 chi can cam them `VectorStrategy` vao
danh sach ma khong sua `SearchService`.

## Test

```bash
pnpm --filter catalog-service test              # unit
pnpm --filter catalog-service test:integration  # Testcontainers, can Docker
```
