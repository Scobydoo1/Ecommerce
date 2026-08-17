# syntax=docker/dockerfile:1
#
# Build tu GOC monorepo:
#   docker build -f apps/storefront/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
COPY .env.example .env
RUN pnpm install --frozen-lockfile
# auth-db phai duoc generate VA build truoc: storefront import ban da bien dich
# (`dist/`) cua no, va webpack danh dau goi nay la external.
RUN pnpm --filter @ecommerce/auth-db prisma:generate
# Qua turbo: `@ecommerce/types` va `@ecommerce/auth-db` phai duoc bien dich
# truoc storefront. Storefront import ban `dist/` cua auth-db, va webpack danh
# dau goi nay la external nen no phai ton tai that luc chay.
RUN pnpm exec turbo run build --filter=storefront

FROM base AS runtime
ENV NODE_ENV=production
# Khong dung `output: 'standalone'`: goi `@ecommerce/auth-db` duoc danh dau
# external trong webpack config, nen file-tracing cua Next khong chac keo no
# theo. Copy ca cay thi to hon nhung chay dung.
COPY --from=build /repo /repo
WORKDIR /repo/apps/storefront

EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
