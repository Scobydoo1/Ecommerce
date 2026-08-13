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

### Tai sao dung `word_similarity` chu khong phai `similarity`

Do thuc te tren du lieu tieng Viet:

| Cap so sanh | `similarity` | `word_similarity` |
|---|---|---|
| "ao" vs "ao thun nam cotton" (dung) | 0.158 | 1.000 |
| "ao thunn" vs "ao thun nam cotton" (dung, sai chinh ta) | 0.333 | 0.778 |
| "may xuc cong nghiep" vs "dong ho co day da" (nham) | 0.167 | 0.185 |

Voi `similarity` hai lop chong lan nhau - truy van ngan dung (0.158) con thap
hon truy van khong lien quan (0.167) - nen **khong ton tai nguong nao tach
duoc chung**. Nguyen nhan: `similarity` chuan hoa theo hop trigram cua ca hai
chuoi nen phat truy van ngan tren ten dai y het truy van sai.

`word_similarity` chuan hoa theo doan khop tot nhat ben trong chuoi dich, tach
hai lop rat sach (0.185 so voi 0.750). Nguong dang dung: **0.45**.

**Danh doi da biet:** goi duoi dang ham nen Postgres khong dung index GIN
trigram (chi toan tu `%>` moi dung duoc). O quy mo MVP dieu nay khong dang ke.
Khi can toi uu: do p95 cua `/search` truoc, roi hoac chuyen sang `%>` kem
`pg_trgm.word_similarity_threshold`, hoac them Meilisearch dung nhu muc 3
CLAUDE.md da du lieu. Index GIN duoc giu lai vi chinh no phuc vu duong `%>` do.

## Test

```bash
pnpm --filter catalog-service test              # unit
pnpm --filter catalog-service test:integration  # Testcontainers, can Docker
```
