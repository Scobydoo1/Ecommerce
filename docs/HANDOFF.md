# Handoff — Phase 1 MVP

Cap nhat: 2026-08-14. Nhanh lam viec: `feat/phase-1-mvp` (chua merge vao `master`).

**Phase 1 da hoan thanh toan bo 16 task.** Ke hoach:
[`docs/superpowers/plans/2026-08-13-phase-1-mvp.md`](superpowers/plans/2026-08-13-phase-1-mvp.md).
Thiet ke va 4 quyet dinh kien truc:
[`docs/superpowers/specs/2026-08-13-phase-1-mvp-design.md`](superpowers/specs/2026-08-13-phase-1-mvp-design.md).

## Trang thai

| Task | Noi dung | Bang chung |
|---|---|---|
| 1-3 | Monorepo, docker-compose, Prisma schema catalog | `pnpm build` xanh, `\dx`/`\dn` da kiem chung |
| 4-8 | slugify, CRUD, normalizeQuery, RRF, TrigramStrategy + `/search` | 55 unit + 12 integration |
| 9-11 | Storefront: layout, chu, danh muc, tim kiem goi y, chi tiet | 26 unit |
| 12-13 | order-service: gio Redis, don hang, Stripe | 21 unit |
| 14 | Auth.js v5 (`packages/auth-db`) | dang ky/dang nhap da thu that |
| 15 | `.github/workflows/ci.yml` | YAML parse duoc, chuoi lenh chay that o local |
| 16 | docs + Playwright e2e | 3 e2e xanh tren trinh duyet that |

**Tong: 102 unit + 12 integration + 3 e2e dang xanh.** Lint va typecheck sach.

## Kiem chung cuoi cung (2026-08-14)

Chay that tren localhost, ca ba service dung `pnpm dev`:

- Go `ao thunn` (thieu dau + thua chu) -> ra "Áo thun nam cotton"
- Go `may lockhong khi` (thieu dau + dinh chu) -> ra "Máy lọc không khí phòng ngủ"
- Goi y `dong ho` -> "Đồng hồ cơ dây da"
- Them gio -> thanh toan -> don `ORD-YYYYMMDD-XXXXXX` -> gio tu don sach
- San pham DRAFT/ARCHIVED khong lot vao trang chu hay ket qua tim kiem

## Con lai cho Phase 1 (neu muon dong hoan toan)

- **Leg thanh toan bang the chua chay that.** Code tao PaymentIntent va xac thuc
  webhook da viet nhung may dev chua co khoa Stripe test. Dat `STRIPE_SECRET_KEY`
  va `STRIPE_WEBHOOK_SECRET` vao `.env` roi thu lai.
- **Chua tru ton kho khi dat hang** - chi kiem tra. Hai nguoi mua mon cuoi cung
  cung luc thi ca hai deu dat duoc. Xem "Gioi han da biet" trong
  [`architecture.md`](architecture.md).
- Chua gui email xac nhan (thuoc Phase 3).

## Luu y moi truong (da tra gia de biet)

- `corepack enable pnpm` bi chan quyen ghi vao `C:\Program Files\nodejs`.
  Dung `npm i -g pnpm` thay the. pnpm hien tai: 11.21.0.
- **Cong 3000 tren may nay bi Open WebUI (Docker) chiem.** `.env` dat `PORT=3100`
  va `AUTH_URL=http://localhost:3100`. Hai service NestJS dung `AUTH_URL` lam
  origin CORS nen hai gia tri phai khop nhau.
- **Dung chay `pnpm build` khi `pnpm dev` dang chay.** `next build` va `next dev`
  ghi vao cung `.next`, ket qua la MODULE_NOT_FOUND va 404 chunk. Neu lo tay:
  dung dev, xoa `apps/storefront/.next`, chay lai.
- **Khong kill tien trinh theo cong ma khong xem ten.** Cong 3000 do
  `com.docker.backend` giu; kill nham lam tat ca Docker Desktop.
- **Khong dat `incremental: true`** trong tsconfig cua service NestJS.
- Prisma CLI chi doc `.env` o cwd, nen moi script Prisma boc qua
  `dotenv -e ../../.env --`. Script `dev`/`build`/`start` cua storefront cung vay:
  Next khong doc `.env` goc monorepo.
- `prisma generate` khong duoc nam trong script `build`: no ghi de query engine
  DLL, ma file do bi khoa khi dev server dang chay.
- **Khi test bang dong lenh tren Windows, dung go tieng Viet co dau thang vao
  `curl -d`.** Shell lam meo UTF-8 truoc khi request roi may. Ghi body ra file roi
  `curl --data-binary @file`. (Da mat mot vong debug vi tuong app hong.)

## Chay lai moi truong dev

```bash
pnpm install
docker compose -f infra/docker/docker-compose.yml up -d --wait

pnpm --filter catalog-service prisma:generate
pnpm --filter order-service prisma:generate
pnpm --filter @ecommerce/auth-db prisma:generate

pnpm --filter catalog-service prisma:deploy
pnpm --filter order-service prisma:deploy
pnpm --filter @ecommerce/auth-db prisma:deploy

pnpm --filter catalog-service seed        # 6 danh muc, 42 san pham
pnpm --filter @ecommerce/auth-db seed     # 3 tai khoan demo

pnpm dev
```

Tai khoan demo: `demo@chongoc.vn` / `demo12345`.

Kiem chung nhanh: `curl "http://localhost:3001/search?q=ao+thunn"` phai tra ve
"Áo thun nam cotton".

## Buoc tiep theo

Phase 1 dat Definition of Done (tru leg the tin dung). Truoc khi sang Phase 2:

1. Merge `feat/phase-1-mvp` vao `master` (xem
   `superpowers:finishing-a-development-branch`).
2. Neu muon dong not leg thanh toan, lay khoa Stripe test roi chay lai luong.
3. Phase 2 bat dau o `services/ai-service` - cot `embedding vector(1536)` va index
   HNSW da san trong bang `catalog.Product`, chi can dien va dang ky them
   `VectorStrategy` vao `SearchService`. `fuseResults` khong phai sua gi.
