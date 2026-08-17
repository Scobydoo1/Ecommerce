# syntax=docker/dockerfile:1
#
# Build context la GOC monorepo, khong phai thu muc service:
#   docker build -f services/catalog-service/Dockerfile .
# Ly do: service phu thuoc packages/types va pnpm-lock.yaml o goc.

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter catalog-service prisma:generate
# Qua turbo chu khong goi thang script cua package: `@ecommerce/types` phai duoc
# bien dich truoc, va turbo moi biet thu tu do (`dependsOn: ["^build"]`).
RUN pnpm exec turbo run build --filter=catalog-service

FROM base AS runtime
ENV NODE_ENV=production
# Copy ca cay da build. Anh to hon muc toi thieu, doi lai khong phai doan xem
# Prisma query engine va cac symlink cua pnpm nam o dau - thu von rat de sai.
COPY --from=build /repo /repo
WORKDIR /repo/services/catalog-service

EXPOSE 3001
CMD ["node", "dist/main"]
