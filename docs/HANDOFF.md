# Handoff — Phase 1 MVP

Cap nhat: 2026-08-14. Nhanh lam viec: `feat/phase-1-mvp` (chua merge vao `master`).

Ke hoach day du: [`docs/superpowers/plans/2026-08-13-phase-1-mvp.md`](superpowers/plans/2026-08-13-phase-1-mvp.md).
Thiet ke va 4 quyet dinh kien truc: [`docs/superpowers/specs/2026-08-13-phase-1-mvp-design.md`](superpowers/specs/2026-08-13-phase-1-mvp-design.md).

## Da xong

| Task | Noi dung | Bang chung |
|---|---|---|
| 1 | Monorepo pnpm + Turborepo, `packages/config`, `packages/types` | `pnpm build`, `pnpm lint` xanh |
| 2 | `docker-compose.yml`: Postgres pgvector + Redis, 3 schema | `\dx` va `\dn` da kiem chung |
| 3 | `catalog-service` + Prisma schema + migration dau | cot `vector(1536)` + 3 index da kiem chung |
| 4 | `slugify` / `uniqueSlug` (TDD) | 9 test |
| 5 | Products + Categories CRUD (TDD) | 14 test |
| 6 | `normalizeQuery` (TDD) | 6 test |
| 7 | `fuseResults` - RRF (TDD) | 8 test |
| 8 | `TrigramStrategy` + `/search` + `/search/suggest` | 26 unit + 12 integration |
| 9 (mot phan) | Storefront: scaffold + `formatMoney` + `useDebouncedValue` (TDD) | 7 test |

**Tong: 62 unit test + 12 integration test dang xanh.** Lint sach.

Hai loi that da bat duoc va sua trong qua trinh nay, deu ghi trong git log:
- `similarity()` khong tach duoc truy van ngan dung khoi truy van sai -> doi sang
  `word_similarity` (do so lieu, khong doan).
- Trong so mo ta chi ap khi tinh diem ma khong ap khi loc -> "dong ho" keo ve ca
  tai nghe va giay sneaker.

## Lam tiep tu day

### Task 9 (con lai) - Storefront: layout, trang chu, trang danh muc
Da co: `package.json`, `next.config.mjs`, `tailwind.config.ts` (bang mau ngoc bich
`#0F6B5C` + vang the `#F2A900`), `jest.config.ts`, `lib/formatMoney.ts`,
`components/search-bar/useDebouncedValue.ts`.

Con thieu:
- `lib/api-client.ts` - wrapper `fetch` co kieu, `next: { revalidate: 60 }`
- `app/layout.tsx` + `app/globals.css` - nap font Bricolage Grotesque (display) va
  Be Vietnam Pro (body) qua `next/font/google`
- `app/(shop)/page.tsx` - trang chu
- `app/(shop)/categories/[slug]/page.tsx`
- `components/product-card/ProductCard.tsx` - the giay khia goc cho gia tien

### Task 10 - Thanh tim kiem + trang ket qua
`SearchBar` debounce 250ms, dieu huong ban phim, `aria-activedescendant`.
Signature cua thiet ke: dong "ban go X · tim theo Y" dung `normalizedQuery` API
da tra ve, phoi bay chinh co che fuzzy.

### Task 11 - Trang chi tiet san pham
RSC + `generateMetadata` cho SEO, `notFound()` khi sai slug.

### Task 12 - `order-service` + gio hang Redis (TDD)
`addItem` gop dong trung, chan vuot ton kho; `calcSubtotalCents`.

### Task 13 - Don hang + Stripe test mode
Chup lai ten va gia tai thoi diem dat. Chi luu `stripePaymentIntentId`.

### Task 14 - Auth.js v5 trong storefront (schema `auth`)

### Task 15 - `.github/workflows/ci.yml`

### Task 16 - `docs/architecture.md`, `docs/setup.md`, Playwright e2e

### Viec cuoi cung nguoi dung da yeu cau
Cau hinh bien moi truong cho **tat ca** service roi chay demo that tren localhost
(storefront :3000, catalog :3001, order :3002).

## Luu y moi truong (da tra gia de biet)

- `corepack enable pnpm` bi chan quyen ghi vao `C:\Program Files\nodejs`.
  Dung `npm i -g pnpm` thay the. pnpm hien tai: 11.21.0.
- pnpm 11 yeu cau khai bao `allowBuilds` trong `pnpm-workspace.yaml`; Prisma phai
  duoc bat thi moi tai duoc query engine.
- Prisma CLI chi doc `.env` o cwd, nen moi script Prisma boc qua
  `dotenv -e ../../.env --`.
- **Khong dat `incremental: true`** trong tsconfig cua service NestJS. File
  `tsbuildinfo` nam ngoai `outDir`, ma `nest build` xoa `dist` chu khong xoa no,
  khien lan build sau "thanh cong" nhung khong emit gi.
- Khi smoke test bang HTTP: **dung `cmd | tail` cho lenh can kiem tra exit code**
  (exit code se la cua `tail`). Va kill server theo cong, khong theo `$!` -
  `$!` bat duoc subshell chu khong phai node, de con server cu song sot phuc vu
  code cu va lam sai ket qua kiem chung.

## Chay lai moi truong dev

```bash
pnpm install
docker compose -f infra/docker/docker-compose.yml up -d --wait
pnpm --filter catalog-service prisma:deploy
pnpm --filter catalog-service seed      # 3 danh muc, 9 san pham tieng Viet
pnpm --filter catalog-service dev       # :3001
```

Kiem chung nhanh: `curl "http://localhost:3001/search?q=ao+thunn"` phai tra ve
"Áo thun nam cotton".
