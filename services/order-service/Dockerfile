# syntax=docker/dockerfile:1
#
# Build tu GOC monorepo:
#   docker build -f services/order-service/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
COPY .env.example .env
RUN pnpm install --frozen-lockfile
RUN pnpm --filter order-service prisma:generate
# Qua turbo: `@ecommerce/types` phai duoc bien dich truoc.
RUN pnpm exec turbo run build --filter=order-service

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/services/order-service

EXPOSE 3002
CMD ["node", "dist/main"]
