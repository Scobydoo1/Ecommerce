-- Extension co the DA duoc cai san o `public` (Postgres quan ly gan nhu luon
-- lam vay), hoac chua co gi. Prisma dat search_path chi gom `catalog`, nen neu
-- extension nam o public thi `vector(1536)` va `gin_trgm_ops` khong resolve
-- duoc va migration chet voi 42704 "type vector does not exist".
-- Dua ca hai schema vao duong tim de chay duoc trong ca hai truong hop.
SET search_path TO catalog, public;

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "categoryId" TEXT,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Phan duoi day viet tay: Prisma schema khong dien ta duoc index bieu thuc
-- (expression index) lan index HNSW cua pgvector.
-- ---------------------------------------------------------------------------

-- unaccent() mac dinh KHONG immutable nen Postgres tu choi dung no trong
-- index expression.
--
-- KHONG dung `ALTER FUNCTION unaccent(text) IMMUTABLE`: unaccent thuoc so huu
-- cua extension nen lenh do doi quyen superuser, va se bi tu choi tren moi
-- Postgres quan ly (Neon, Supabase, Railway...). Khi do index nay khong tao
-- duoc, tuc la tim kiem mo - tinh nang chinh cua san pham - chet ngay khi deploy.
--
-- Thay vao do tu tao mot ham boc ma minh so huu. Dang hai tham so
-- `unaccent('unaccent', $1)` chi ro tu dien nen ket qua tat dinh, do la ly do
-- danh dau IMMUTABLE o day la dung chu khong phai noi doi trinh toi uu.
-- `SET search_path` gan vao ham: tu dien 'unaccent' duoc resolve luc GOI ham,
-- ma luc do search_path cua ung dung chi co `catalog`. Neu extension nam o
-- public thi moi loi goi tim kiem se hong khi chay. Ghim duong tim vao ham
-- khien no dung o moi noi, khong phu thuoc nguoi goi.
CREATE FUNCTION immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
  SET search_path = catalog, public, pg_catalog
  AS $$ SELECT unaccent('unaccent', $1) $$;

-- Fuzzy search: khong dau, khong phan biet hoa thuong.
-- "ao thun" / "áo thun" / "Aó Thun" deu khop cung mot index.
CREATE INDEX "Product_name_trgm_idx"
  ON "Product" USING GIN (lower(immutable_unaccent("name")) gin_trgm_ops);

CREATE INDEX "Product_description_trgm_idx"
  ON "Product" USING GIN (lower(immutable_unaccent(coalesce("description", ''))) gin_trgm_ops);

-- Semantic search Phase 2 (AD-1). Cot "embedding" luon NULL trong Phase 1;
-- index tao san de Phase 2 chi viec fill du lieu va bat VectorStrategy.
CREATE INDEX "Product_embedding_hnsw_idx"
  ON "Product" USING hnsw ("embedding" vector_cosine_ops);
