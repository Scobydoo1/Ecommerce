# CLAUDE.md — AI-Native E-commerce Platform

Đây là file hướng dẫn chính cho Claude Code khi làm việc trên repository này. Đọc kỹ trước khi thực hiện bất kỳ thay đổi nào. File này là "nguồn sự thật" (source of truth) về kiến trúc, quy ước code, và lộ trình triển khai.

---

## 1. Tổng quan dự án

**Tên dự án:** AI-Native E-commerce Platform

**Mô tả:** Nền tảng thương mại điện tử hiện đại kết hợp 4 lớp chức năng:
1. **Storefront + Smart Search** — khách hàng tìm kiếm sản phẩm bằng fuzzy search + semantic search (gõ sai chính tả, gõ gần đúng vẫn ra kết quả đúng)
2. **AI Customer Service Agent** — chatbot RAG tư vấn khách hàng, trả lời dựa trên dữ liệu sản phẩm + FAQ
3. **Admin Ops Dashboard** — nhân viên quản lý sản phẩm, đơn hàng, kho
4. **Analytics Dashboard** — chủ shop xem doanh số, hành vi khách hàng theo thời gian thực

**Loại dự án:** SaaS / E-commerce platform, monorepo, multi-service

**Quy mô mục tiêu:** Bắt đầu từ MVP (Phase 1), scale dần lên production. Không over-engineer ngay từ đầu — mỗi phase chỉ build đúng phần cần thiết.

**Nguyên tắc tối quan trọng:** Luôn triển khai theo đúng thứ tự Phase ở mục 6. KHÔNG được nhảy sang Phase sau khi Phase trước chưa đạt Definition of Done.

---

## 2. Nguyên tắc làm việc cho Claude Code

- **Luôn hỏi trước khi quyết định kiến trúc lớn** (đổi database, đổi framework, thêm service mới ngoài kế hoạch).
- **Test-Driven Development**: viết test trước khi viết implementation cho mọi logic nghiệp vụ (business logic), đặc biệt ở `catalog-service`, `order-service`, `ai-service`.
- **Commit nhỏ, thường xuyên**, theo chuẩn Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- **Không tự ý cài thêm package** ngoài danh sách ở mục 3 nếu chưa có lý do rõ ràng — nếu cần, giải thích lý do trước khi thêm.
- **Luôn chạy lint + test trước khi coi task là hoàn thành.** Không tuyên bố "xong" nếu chưa chạy và xác nhận kết quả.
- **Viết tài liệu song song với code**: mỗi service mới cần có `README.md` riêng trong thư mục của nó.
- **Bảo mật là mặc định**: không hardcode secrets, luôn dùng `.env`, không log dữ liệu nhạy cảm (thông tin thanh toán, mật khẩu).
- **Ưu tiên đơn giản trước, tối ưu sau**: MVP chạy được quan trọng hơn là kiến trúc hoàn hảo.

---

## 3. Tech Stack

### Frontend
| App | Stack | Ghi chú |
|---|---|---|
| `apps/storefront` | Next.js 14 (App Router) + TypeScript + TailwindCSS + shadcn/ui | SSR cho SEO, React Server Components cho trang sản phẩm |
| `apps/admin` | React + Vite + TypeScript + TailwindCSS + shadcn/ui | SPA nội bộ, không cần SEO |

### Backend / Services
| Service | Stack | Vai trò |
|---|---|---|
| `services/catalog-service` | NestJS + TypeScript + Prisma | CRUD sản phẩm, danh mục, tồn kho, search endpoint |
| `services/order-service` | NestJS + TypeScript + Prisma | Giỏ hàng, đơn hàng, tích hợp thanh toán |
| `services/ai-service` | Python + FastAPI + LangGraph | Embedding, RAG chatbot, dự báo doanh số |
| `services/analytics-service` | Node.js (hoặc Go) | Thu thập event, đẩy vào pipeline analytics |

### Data Layer
- **PostgreSQL 16** (+ extension `pg_trgm`, `pgvector`) — dữ liệu giao dịch chính, semantic search
- **Redis** — cache, session, giỏ hàng, queue (BullMQ)
- **Meilisearch** (thêm ở Phase 1 nếu pg_trgm không đủ nhanh) — search-as-you-type
- **ClickHouse** (Phase 4) — lưu trữ và truy vấn analytics real-time
- **Kafka / Redpanda** (Phase 4) — event streaming

### AI / ML
- LLM API: Claude hoặc OpenAI (qua biến môi trường, không hardcode provider)
- Embedding: model của provider LLM hoặc `text-embedding-3-small`
- Orchestration: LangGraph cho luồng agent

### Thanh toán
- Stripe (test mode trước) — có thể thêm VNPay/MoMo adapter sau

### Hạ tầng
- **Monorepo:** pnpm workspaces + Turborepo
- **Container:** Docker + docker-compose (dev), Kubernetes (production, Phase 4+)
- **CI/CD:** GitHub Actions (lint, test, build trên mỗi PR)
- **Observability:** Sentry (lỗi), PostHog (product analytics), Grafana + Prometheus (Phase 4)

---

## 4. Kiến trúc Monorepo & Folder Structure

```
ecommerce-platform/
├── README.md
├── CLAUDE.md                      # File này
├── AGENTS.md                      # Quy ước cho các AI agent trong ai-service
├── .env.example
├── .gitignore
├── turbo.json                     # Cấu hình Turborepo
├── pnpm-workspace.yaml
├── package.json
│
├── apps/
│   ├── storefront/                # Next.js — khách hàng dùng
│   │   ├── app/
│   │   │   ├── (shop)/
│   │   │   │   ├── page.tsx              # Trang chủ
│   │   │   │   ├── search/page.tsx       # Trang kết quả tìm kiếm
│   │   │   │   ├── products/[slug]/page.tsx
│   │   │   │   ├── cart/page.tsx
│   │   │   │   └── checkout/page.tsx
│   │   │   ├── api/                      # Route handlers nếu cần proxy
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── chat-widget/              # Widget chatbot AI (Phase 2)
│   │   │   ├── search-bar/
│   │   │   └── product-card/
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   └── auth.ts
│   │   ├── public/
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── admin/                     # React + Vite — nhân viên dùng (Phase 3)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── products/
│       │   │   ├── orders/
│       │   │   ├── inventory/
│       │   │   └── analytics/            # Phase 4
│       │   ├── components/
│       │   ├── hooks/
│       │   └── lib/
│       ├── package.json
│       └── README.md
│
├── services/
│   ├── catalog-service/           # NestJS — sản phẩm & search
│   │   ├── src/
│   │   │   ├── products/
│   │   │   │   ├── products.controller.ts
│   │   │   │   ├── products.service.ts
│   │   │   │   ├── products.module.ts
│   │   │   │   └── dto/
│   │   │   ├── search/
│   │   │   │   ├── search.controller.ts
│   │   │   │   ├── search.service.ts      # logic fuzzy + semantic search
│   │   │   │   └── strategies/            # pg_trgm strategy, vector strategy
│   │   │   ├── categories/
│   │   │   └── common/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── test/
│   │   │   ├── unit/
│   │   │   └── integration/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── order-service/             # NestJS — đơn hàng & thanh toán
│   │   ├── src/
│   │   │   ├── orders/
│   │   │   ├── cart/
│   │   │   ├── payments/
│   │   │   │   ├── stripe/
│   │   │   │   └── vnpay/                 # thêm sau, adapter pattern
│   │   │   └── common/
│   │   ├── prisma/
│   │   ├── test/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── ai-service/                # FastAPI — chatbot, embedding, dự báo
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── routers/
│   │   │   │   ├── chat.py
│   │   │   │   ├── embeddings.py
│   │   │   │   └── forecast.py
│   │   │   ├── agents/
│   │   │   │   └── customer_support_agent.py
│   │   │   ├── rag/
│   │   │   │   ├── ingestion.py
│   │   │   │   ├── retriever.py
│   │   │   │   └── vector_store.py
│   │   │   ├── prompts/
│   │   │   │   └── templates/
│   │   │   └── core/
│   │   │       ├── config.py
│   │   │       └── llm_client.py
│   │   ├── evals/
│   │   │   ├── datasets/
│   │   │   └── reports/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   └── analytics-service/         # Phase 4 — event ingestion
│       ├── src/
│       │   ├── ingest/
│       │   ├── consumers/
│       │   └── clickhouse/
│       ├── test/
│       ├── package.json
│       └── README.md
│
├── packages/                      # Code dùng chung giữa các app/service
│   ├── ui/                        # Shared component library (shadcn-based)
│   ├── config/                    # eslint, tsconfig, tailwind config chung
│   └── types/                     # Shared TypeScript types / DTO
│
├── infra/
│   ├── docker/
│   │   └── docker-compose.yml     # postgres, redis, meilisearch (dev)
│   ├── kubernetes/                # Phase 4+
│   └── terraform/                 # Phase 4+ (nếu deploy cloud managed)
│
├── docs/
│   ├── architecture.md
│   ├── setup.md
│   ├── api-reference.md
│   └── decisions/                 # ADR — Architecture Decision Records
│
├── tests/
│   └── e2e/                       # Playwright — test luồng end-to-end toàn hệ thống
│
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

**Quy ước đặt tên:**
- Thư mục: `kebab-case`
- File TypeScript/React component: `PascalCase.tsx` cho component, `camelCase.ts` cho utils
- File Python: `snake_case.py`
- Không tạo folder rỗng "phòng khi cần sau" — chỉ tạo khi có file thật bên trong.

---

## 5. Biến môi trường cần thiết (`.env.example`)

```
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379

# Search
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=

# AI
LLM_PROVIDER=anthropic   # hoặc openai
LLM_API_KEY=
EMBEDDING_MODEL=text-embedding-3-small

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Auth
AUTH_SECRET=
AUTH_URL=http://localhost:3000

# Observability
SENTRY_DSN=
POSTHOG_KEY=
```

---

## 6. Lộ trình triển khai theo Phase

### Phase 1 — MVP: Storefront + Smart Search (bắt buộc làm trước tiên)
**Mục tiêu:** Có một web bán hàng chạy được thật, khách vào tìm và mua được sản phẩm.

Việc cần làm:
- [ ] Khởi tạo monorepo (pnpm + Turborepo), `docker-compose.yml` chạy Postgres + Redis
- [ ] `catalog-service`: schema Prisma cho `Product`, `Category`; API CRUD sản phẩm
- [ ] Search endpoint: kết hợp `pg_trgm` (fuzzy) + `pgvector` (semantic) — trả kết quả theo độ liên quan
- [ ] `storefront`: trang chủ, trang danh mục, trang chi tiết sản phẩm, thanh tìm kiếm có gợi ý (autocomplete)
- [ ] Giỏ hàng (lưu Redis theo session)
- [ ] `order-service`: tạo đơn hàng cơ bản, tích hợp Stripe (test mode)
- [ ] Auth cơ bản cho khách hàng (email + password hoặc magic link)
- [ ] CI: lint + unit test chạy tự động trên mỗi PR

**Definition of Done:** Người dùng có thể tìm sản phẩm (kể cả gõ gần đúng/sai chính tả), xem chi tiết, thêm giỏ hàng, thanh toán test qua Stripe, và nhận xác nhận đơn hàng.

### Phase 2 — AI Customer Service Agent
- [ ] `ai-service`: pipeline embedding cho sản phẩm + FAQ, lưu vào `pgvector`
- [ ] RAG chatbot endpoint (`/chat`) trả lời câu hỏi dựa trên dữ liệu đã embed
- [ ] Widget chat nhúng trên `storefront`
- [ ] `evals/`: bộ dataset nhỏ (20-30 câu hỏi mẫu) để đánh giá chất lượng trả lời trước khi release

**Definition of Done:** Chatbot trả lời đúng câu hỏi về sản phẩm/chính sách với độ chính xác đo được qua eval, có fallback báo "không chắc" thay vì bịa thông tin.

### Phase 3 — Admin Ops Dashboard
- [ ] `apps/admin`: trang quản lý sản phẩm, đơn hàng, tồn kho
- [ ] Role-based access control (admin / staff)
- [ ] Thông báo email khi có đơn hàng mới

**Definition of Done:** Nhân viên có thể quản lý toàn bộ vòng đời sản phẩm và đơn hàng mà không cần vào database trực tiếp.

### Phase 4 — Analytics Real-time
- [ ] `analytics-service`: thu thập event (page view, add-to-cart, purchase)
- [ ] Kafka/Redpanda → ClickHouse
- [ ] Dashboard biểu đồ doanh số, phễu chuyển đổi (funnel), dự báo xu hướng

**Definition of Done:** Chủ shop xem được doanh số theo thời gian thực và dự báo tuần tới với sai số chấp nhận được.

---

## 7. Testing Strategy

- **Unit test**: mọi service method có business logic (Jest cho Node, pytest cho Python)
- **Integration test**: test API endpoint với database thật (dùng test container, không mock DB cho integration test)
- **E2E test**: Playwright cho luồng quan trọng nhất — tìm kiếm → thêm giỏ hàng → thanh toán
- **AI eval**: `ai-service/evals/` — chấm điểm câu trả lời chatbot theo bộ câu hỏi mẫu, không release nếu độ chính xác giảm so với baseline

---

## 8. Bảo mật & Governance

- Không lưu thông tin thẻ thanh toán — luôn qua Stripe/VNPay tokenization
- Rate limiting cho API search và chat để tránh abuse
- Input validation ở mọi endpoint (class-validator cho NestJS, Pydantic cho FastAPI)
- Log không chứa PII (email, số điện thoại) ở mức plaintext trong log production

---

## 9. Lệnh thường dùng

```bash
# Cài đặt
pnpm install

# Chạy toàn bộ dev environment (docker + services)
docker compose -f infra/docker/docker-compose.yml up -d
pnpm dev

# Test
pnpm test              # toàn bộ monorepo
pnpm --filter catalog-service test

# Lint
pnpm lint

# Build
pnpm build
```

---

## 10. Danh sách file cần tạo đầu tiên (theo thứ tự)

1. `pnpm-workspace.yaml`, `turbo.json`, root `package.json` — khung monorepo
2. `.env.example`, `.gitignore`
3. `infra/docker/docker-compose.yml` — Postgres + Redis
4. `services/catalog-service/prisma/schema.prisma` — schema `Product`, `Category`
5. `services/catalog-service/src/products/*` — CRUD sản phẩm
6. `services/catalog-service/src/search/*` — search service (pg_trgm + pgvector)
7. `apps/storefront/app/layout.tsx`, `app/(shop)/page.tsx`
8. `apps/storefront/components/search-bar/*`
9. `apps/storefront/app/(shop)/products/[slug]/page.tsx`
10. `services/order-service/prisma/schema.prisma` — schema `Order`, `OrderItem`
11. `services/order-service/src/payments/stripe/*`
12. `.github/workflows/ci.yml`
13. `docs/architecture.md`
14. `docs/setup.md`

---

**Ghi nhớ cho Claude Code:** Chỉ bắt đầu code sau khi đã xác nhận rõ đang ở Phase nào. Nếu người dùng yêu cầu tính năng thuộc Phase sau trong khi Phase hiện tại chưa xong, hãy hỏi lại trước khi thực hiện.
