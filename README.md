<div align="center">

# 🌟 Lumotus

**Smart Flashcard — Ứng dụng học từ vựng Tiếng Anh theo phương pháp SRS**

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[📖 API Docs](#api-docs) · [🚀 Quick Start](#quick-start) · [🏗 Architecture](#architecture) · [🤝 Contributing](#contributing)

</div>

---

## 📌 Tổng quan

Lumotus là ứng dụng học từ vựng Tiếng Anh fullstack, lấy cảm hứng từ **Quizlet**, được xây dựng với:

- **Spaced Repetition System (SRS)** theo thuật toán SM-2 — ôn đúng thẻ, đúng lúc
- **AI Generate** — tự động tạo bộ thẻ từ một chủ đề bằng OpenAI / Claude
- **Import CSV / Excel / DOCX** — nhập từ vựng hàng loạt
- **Quiz mode** — trắc nghiệm MCQ / True-False có timer
- **Leaderboard + XP** — gamification giữ động lực học tập
- **Cloudinary** — lưu ảnh minh hoạ card trên cloud CDN miễn phí

---

## 🏗 Architecture

```
┌─────────────────┐     HTTP/REST      ┌──────────────────────┐
│   React 18 SPA  │ ──────────────────▶│  Spring Boot 4 API   │
│  (Vite + TS)    │ ◀──────────────────│  Port 8080           │
└─────────────────┘                    └──────────┬───────────┘
      Port 3000                                   │
                                        ┌─────────┴──────────┐
                                        │                    │
                               ┌────────▼──────┐   ┌────────▼──────┐
                               │  PostgreSQL 17 │   │   Redis 7     │
                               │  Port 5432    │   │   Port 6379   │
                               └───────────────┘   └───────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS v4, Framer Motion, React Query v5 |
| **Backend** | Spring Boot 4, Spring Security, JPA/Hibernate, Flyway, MapStruct |
| **Auth** | JWT Access Token (15m) + Refresh Token in Redis (7d) + RBAC |
| **Database** | PostgreSQL 17 (main) + Redis 7 (cache & token store) |
| **Media** | Cloudinary (25GB free CDN, auto image transform) |
| **AI** | OpenAI GPT / Anthropic Claude (pluggable via config) |
| **DevOps** | Docker Compose, GitHub Actions CI/CD, Nginx |

---

## ⚡ Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- [Node.js](https://nodejs.org/) ≥ 20 (for frontend dev)
- [JDK 21](https://adoptium.net/) (for backend dev)
- Tài khoản [Cloudinary](https://cloudinary.com) (free)

### 1. Clone & cấu hình môi trường

```bash
git clone https://github.com/your-org/lumotus.git
cd lumotus

# Copy template và điền thông tin thực tế
cp .env.example .env
```

Mở `.env` và cập nhật ít nhất các giá trị sau:

```env
JWT_SECRET=<chuỗi random ≥ 256-bit>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
OPENAI_API_KEY=<sk-...>          # nếu dùng AI Generate
```

> 💡 Tạo JWT secret: `openssl rand -base64 64`

### 2. Khởi động Infrastructure (DB + Redis)

```bash
# Chỉ khởi động PostgreSQL và Redis
docker compose up -d

# (Tùy chọn) Thêm pgAdmin tại http://localhost:5050
docker compose --profile tools up -d pgadmin
```

Kiểm tra: `docker compose ps` — tất cả services phải ở trạng thái `healthy`.

### 3. Chạy Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend khởi động tại **http://localhost:8080**  
Flyway sẽ tự động chạy migration và tạo toàn bộ schema.

> 📄 Swagger UI: http://localhost:8080/swagger-ui.html

### 4. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại **http://localhost:3000**

---

## 📁 Project Structure

```
lumotus/
├── backend/                        # Spring Boot 4
│   ├── src/main/java/com/backend/lumotus/
│   │   ├── config/                 # Security, Redis, Async, JPA config
│   │   ├── controller/             # REST Controllers
│   │   ├── service/                # Business logic
│   │   ├── repository/             # JPA Repositories
│   │   ├── entity/
│   │   │   └── common/             # BaseEntity, SoftDeleteEntity
│   │   ├── dto/                    # Request / Response DTOs
│   │   ├── mapper/                 # MapStruct mappers
│   │   ├── exception/              # GlobalExceptionHandler
│   │   ├── security/               # JwtFilter, UserDetailsService
│   │   ├── async/                  # TaskDispatcher pattern
│   │   └── scheduler/              # @Scheduled jobs
│   ├── src/main/resources/
│   │   ├── db/migration/           # Flyway SQL (V1__init.sql, ...)
│   │   └── application.yaml
│   └── pom.xml
│
├── frontend/                       # React 18 + Vite
│   └── src/
│       ├── api/                    # Axios client + API functions
│       ├── components/
│       │   ├── layout/             # MainLayout, AuthLayout
│       │   └── ui/                 # Shared components (Button, Card...)
│       ├── hooks/                  # Custom React hooks
│       ├── pages/                  # Route-level pages
│       ├── store/                  # Zustand state management
│       ├── types/                  # TypeScript interfaces
│       └── utils/                  # Helpers
│
├── docker-compose.yml              # Dev: PostgreSQL + Redis
├── .env.example                    # Environment template
└── README.md
```

---

## 🌍 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_HOST` | ✅ | `localhost` | PostgreSQL host |
| `DB_NAME` | ✅ | `lumotus` | Database name |
| `DB_USER` | ✅ | `lumotus_user` | DB username |
| `DB_PASSWORD` | ✅ | — | DB password |
| `REDIS_HOST` | ✅ | `localhost` | Redis host |
| `JWT_SECRET` | ✅ | — | JWT signing secret (≥ 256-bit) |
| `JWT_ACCESS_EXPIRY_MS` | ❌ | `900000` | Access token TTL (15 phút) |
| `JWT_REFRESH_EXPIRY_DAYS` | ❌ | `7` | Refresh token TTL |
| `CLOUDINARY_CLOUD_NAME` | ✅ | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | — | Cloudinary API secret |
| `AI_PROVIDER` | ❌ | `openai` | AI provider: `openai` \| `claude` |
| `OPENAI_API_KEY` | ❌ | — | OpenAI API key |
| `CORS_ALLOWED_ORIGINS` | ❌ | `http://localhost:3000` | Frontend origin |

Xem đầy đủ trong [.env.example](.env.example).

---

## 📡 API Docs

Sau khi backend chạy, truy cập:

| URL | Mô tả |
|---|---|
| http://localhost:8080/swagger-ui.html | Swagger UI (interactive) |
| http://localhost:8080/api-docs | OpenAPI JSON spec |
| http://localhost:8080/actuator/health | Health check endpoint |

### Nhóm Endpoints chính

| Group | Base Path | Auth |
|---|---|---|
| Authentication | `/api/v1/auth/*` | Public |
| Topics | `/api/v1/topics` | Public (GET), Admin (CUD) |
| Decks & Cards | `/api/v1/decks/*` | User |
| SRS Review | `/api/v1/review/*` | User |
| Quiz | `/api/v1/quiz/*` | User |
| Progress | `/api/v1/progress/*` | User |
| Leaderboard | `/api/v1/leaderboard` | User |
| Media Upload | `/api/v1/media/*` | User |
| Admin | `/api/v1/admin/*` | Admin |

---

## 🗄 Database

Schema được quản lý bởi **Flyway** — không bao giờ sửa file migration đã chạy.

```bash
# Kiểm tra trạng thái migration
./mvnw flyway:info

# Repair nếu có vấn đề
./mvnw flyway:repair
```

### Bảng chính

| Bảng | Mô tả |
|---|---|
| `users` | Tài khoản người dùng |
| `topics` | Chủ đề hệ thống (Admin-only) |
| `decks` | Bộ thẻ học |
| `cards` | Thẻ từ vựng (front/back/phonetic/image) |
| `deck_topics` | Deck ↔ Topic (many-to-many) |
| `deck_tags` | Nhãn cá nhân của User |
| `user_card_review` | Trạng thái SRS mỗi user × card |
| `quiz_attempts` | Lịch sử làm quiz |
| `daily_activity` | Hoạt động học theo ngày (heatmap) |
| `async_jobs` | Trạng thái AI generate / import |

---

## 🚀 Production Deployment

### Docker Compose (VPS)

```bash
# Build images
docker compose -f docker-compose.prod.yml build

# Chạy toàn bộ stack
docker compose -f docker-compose.prod.yml up -d
```

### CI/CD (GitHub Actions)

Push lên branch `main` → tự động:
1. Chạy test (`./mvnw test`)
2. Build Docker image
3. Push lên Docker Hub
4. SSH vào VPS → `docker compose up -d`

---

## 🤝 Contributing

```bash
# Tạo feature branch
git checkout -b feature/your-feature-name

# Commit theo convention
git commit -m "feat(review): add srs review endpoint"

# Push và tạo Pull Request vào develop
git push origin feature/your-feature-name
```

### Branching Strategy

| Branch | Mục đích |
|---|---|
| `main` | Production-ready, protected |
| `develop` | Integration branch |
| `feature/*` | Tính năng mới |
| `hotfix/*` | Sửa lỗi khẩn cấp |

---

## 📚 Documentation

Tài liệu chi tiết trong thư mục [`docs/`](docs/README.md):

| File | Nội dung |
|---|---|
| [`docs/progress.md`](docs/progress.md) | **Tiến độ session** — đã xong gì, làm tiếp gì |
| [`docs/development-plan.md`](docs/development-plan.md) | Kế hoạch sprint code (Sprint 0–6) |
| [`docs/spec.md`](docs/spec.md) | Đặc tả kỹ thuật: schema, API, SM-2 |
| [`docs/flashcard-project-plan.md`](docs/flashcard-project-plan.md) | Roadmap tổng thể, Redis, deploy |
| [`docs/ui-design-plan.md`](docs/ui-design-plan.md) | Design system & màn hình FE |
| [`docs/figma-wireframe-spec.md`](docs/figma-wireframe-spec.md) | Wireframe Figma |

---

## 📄 License

MIT License — xem [LICENSE](LICENSE) để biết thêm.

---

<div align="center">

Made with ❤️ by Lumotus Team · Spring Boot 4 + React 18

</div>
