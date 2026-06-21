---
name: lumotus
description: >-
  Lumotus — ứng dụng flashcard học tiếng Anh (SRS SM-2, quiz, XP, AI generate).
  Monorepo Spring Boot 4 + React 18. Dùng khi sửa bug, thêm API/UI, migration DB,
  đồng bộ docs. Căn docs/spec.md và docs/flashcard-project-plan.md;
  docs/progress.md cho tiến độ session; README root cho quick start.
---

# Lumotus — ngữ cảnh và quy trình phát triển

## Overview

**Lumotus** là ứng dụng học từ vựng kiểu Quizlet với SRS (SM-2), quiz, gamification (XP/streak/leaderboard), import CSV/Excel, AI generate deck. Quy mô ~10–100 user, deploy VPS Docker.

Stack:
- Backend: Spring Boot 4, Java 21, JPA, Flyway, Spring Security JWT, Redis
- Frontend: React 18, TypeScript, Vite, TailwindCSS v4, React Query, Zustand
- DB: PostgreSQL 17 + Redis 7 + Cloudinary (media)

API prefix: `/api/v1`. Auth: JWT access 15m + refresh token Redis 7d. RBAC: `USER` / `ADMIN`.

## When to Use

- Sửa bug trong logic nghiệp vụ (SRS, quiz, progress, auth)
- Thêm endpoint API hoặc UI mới
- Thêm migration Flyway
- Đồng bộ docs khi đổi schema/API
- Đọc tiến độ session trước khi bắt đầu task

## Process

### 1. Đọc ngữ cảnh trước khi code

Đọc theo thứ tự ưu tiên:
1. `docs/progress.md` — xem Next và checklist session hiện tại
2. `docs/spec.md` §2–§5 — schema, API, SM-2 algorithm
3. `docs/flashcard-project-plan.md` §2.2–2.3, §4, §9 — cấu trúc repo, roadmap
4. `docs/development-plan.md` — sprint code hiện tại

### 2. Xác định phạm vi thay đổi

- Chỉ sửa code/docs liên quan task
- Không refactor ngoài scope
- Nếu đụng DB → kiểm tra §2.3 index; không thêm query JOIN `cards` chỉ để lọc deck trên SRS
- Migration: chỉ thêm `V{n}__*.sql`, không sửa migration đã chạy

### 3. Implement theo cấu trúc package hiện có

Thứ tự: `controller` → `service` → `repository` → `entity/dto` → `mapper`

Hot paths:
- `GET /review/due?deckId=` → `user_card_review` WHERE `user_id`, `deck_id`, `next_review_at` — dùng `idx_ucr_user_deck_due`
- `GET /decks?topicId=` → JOIN `deck_topics` — `idx_deck_topics_topic`
- `GET /decks/{id}/cards` → `page`/`size` default 50; `idx_cards_deck_sort`
- `POST /review/{cardId}/rate` → Một `@Transactional`: review + daily_activity + xp + deck progress
- `GET /leaderboard` → Redis sorted set `ZADD`/`ZREVRANGE`; fallback `idx_users_xp_leaderboard`
- Streak scheduler → `WHERE last_study_date < CURRENT_DATE - 1` + `idx_users_last_study`

### 4. Cập nhật docs

Khi đổi schema/API:
1. Cập nhật `docs/spec.md` §2.2–2.3 §4 trước
2. Cập nhật `docs/flashcard-project-plan.md` §2.2–2.3 §4
3. Cuối session → cập nhật `docs/progress.md`

### 5. Kiểm tra trước khi kết thúc

- Chạy test / migration verify
- Xác nhận docs đã đồng bộ
- Không commit `.env`, secrets, API keys

## Rationalizations

| Excuse | Rebuttal |
|--------|----------|
| "Schema này đơn giản, không cần migration" | Mọi đổi schema đều cần `V{n}__*.sql`. Flyway quản lý version DB. |
| "Tôi JOIN cards để filter deck cho nhanh" | SRS dùng `user_card_review.deck_id` denormalized. Không JOIN `cards`. |
| "Tôi refactor nhanh đoạn code này" | Scope là task hiện tại. Refactor ngoài scope tạo noise và rủi ro. |
| "Để tôi commit luôn, không cần verify" | Mọi commit cần evidence: test pass, migration ok, docs đồng bộ. |
| "Migration cũ sai, tôi sửa trực tiếp" | Không sửa migration đã chạy. Tạo `V{n+1}__fix.sql` mới. |
| "Docs cũng được, code quan trọng hơn" | Spec và plan là nguồn sự thật. Code mà docs lệch → tech debt. |

## Red Flags

- Đang viết `JOIN cards` trong query SRS → dừng, dùng `deck_id` denormalized
- Đang sửa file migration đã có trong DB → dừng, tạo migration mới
- Thay đổi API mà không cập nhật `docs/spec.md` → dừng, cập nhật docs trước
- Refactor hàng loạt file không liên quan task → dừng, thu hẹp scope
- Thêm `.env` hoặc hardcoded secret → dừng, dùng config/secret manager

## Verification

Trước khi kết thúc task, đảm bảo:

- [ ] Đọc qua `docs/spec.md` và `docs/flashcard-project-plan.md` đã cập nhật nếu đổi schema/API
- [ ] Migration mới có tên `V{n}__*.sql` và không xung đột với migration đã chạy
- [ ] Query SRS không JOIN `cards` chỉ để filter deck
- [ ] `user_card_review.deck_id` được gán khi tạo review (copy, first review, import)
- [ ] Test/migration verify đã chạy
- [ ] Commit message theo format: `<type>(<module>): <message>` — không dùng `backend`/`frontend`
- [ ] Không commit `.env`, secrets, API keys

## Commit Message Format

```
<type>(<module>): <message>
```

- **type**: `feat`, `fix`, `style`, `refactor`, `docs`, `test`, `chore`
- **module**: domain theo `docs/spec.md` — `auth`, `topic`, `deck`, `tag`, `review`, `quiz`, `progress`, `media`, `admin`, `async`, `db`, `core`, `docs`, `infra`
- **message**: lowercase, imperative, ≤ 72 chars, không chấm cuối

Ví dụ:
```
feat(auth): add jwt auth filter
fix(review): correct sm-2 interval on again rating
feat(db): add V1 init schema migration
docs(docs): sync spec indexes with project plan
```

❌ Không chấp nhận: `feat(BE): ...`, `fix(FE): ...`, `backend: ...`

## Repo Structure

```
lumotus/
├── backend/src/main/java/com/backend/lumotus/
│   ├── controller/          # REST endpoints
│   ├── service/             # Business logic
│   ├── repository/          # Spring Data JPA
│   ├── entity/              # JPA entities
│   ├── dto/                 # Request/Response DTOs
│   ├── mapper/              # MapStruct mappers
│   ├── security/            # JWT, OAuth2
│   ├── config/              # App configs
│   ├── async/               # Async job handlers
│   ├── scheduler/           # Cron jobs
│   ├── review/              # SM-2 algorithm
│   └── media/               # Cloudinary integration
├── backend/src/main/resources/db/migration/  # Flyway V1__init.sql, ...
├── frontend/src/
│   ├── api/                 # Axios clients
│   ├── components/          # Reusable UI
│   ├── pages/               # Route pages
│   ├── hooks/               # Custom hooks
│   ├── store/               # Zustand stores
│   └── types/               # TypeScript types
├── docs/
│   ├── spec.md              # Đặc tả kỹ thuật (schema, API, SM-2)
│   ├── flashcard-project-plan.md  # Roadmap 6 giai đoạn
│   ├── development-plan.md        # Sprint code
│   ├── progress.md                # Tiến độ session
│   ├── ui-design-plan.md
│   └── figma-wireframe-spec.md
└── README.md                # Quick start (root)
```

## Key Business Rules

- Soft-delete: `deleted_at IS NULL` trong query và partial index
- `user_card_review.deck_id`: gán khi tạo review; không JOIN `cards` chỉ để lọc SRS theo deck
- `daily_activity` heatmap; streak scheduler chạy 00:01
- Search: `search_vector` generated column (`simple` config), không expression index runtime
- HikariCP VPS 2GB: `maximum-pool-size: 10`, `minimum-idle: 2`

## Frontend Conventions

- Axios interceptor: JWT + silent refresh qua cookie
- React Query cho server state; Zustand cho UI/auth nhẹ
- Poll `GET /api/v1/jobs/{jobId}` mỗi 2s cho AI/import
- TailwindCSS v4; WCAG 2.1 AA cho accessibility
