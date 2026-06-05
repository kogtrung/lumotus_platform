---
name: lumotus
description: >-
  Lumotus — ứng dụng flashcard học tiếng Anh (SRS SM-2, quiz, XP, AI generate).
  Monorepo Spring Boot 4 + React 18. Dùng khi sửa bug, thêm API/UI, migration DB,
  đồng bộ docs. Căn spec.md (đặc tả kỹ thuật) và flashcard-project-plan.md
  (roadmap triển khai); README cho quick start.
---

# Lumotus — ngữ cảnh dự án

## Đây là gì

**Lumotus** — ứng dụng học từ vựng kiểu Quizlet: SRS (SM-2), quiz, gamification (XP/streak/leaderboard), import CSV/Excel, AI generate deck. Quy mô ~10–100 user, deploy VPS Docker.

| Tầng | Stack |
|---|---|
| Backend | Spring Boot 4, Java 21, JPA, Flyway, Spring Security JWT, Redis |
| Frontend | React 18, TypeScript, Vite, TailwindCSS v4, React Query, Zustand |
| DB | PostgreSQL 17 + Redis 7 + Cloudinary (media) |

API prefix: `/api/v1`. Auth: JWT access 15m + refresh token Redis 7d. RBAC: `USER` / `ADMIN`.

## Repo

```
lumotus/
├── backend/src/main/java/com/backend/lumotus/   # controller, service, repository, entity, dto, mapper, security, async, scheduler
├── backend/src/main/resources/db/migration/       # Flyway V1__init.sql, ...
├── frontend/src/                                  # api, components, pages, hooks, store, types
├── spec.md                                        # Đặc tả kỹ thuật (schema, API, SM-2, streak)
├── flashcard-project-plan.md                      # Roadmap 6 giai đoạn, cấu trúc, Redis, perf
└── README.md                                      # Quick start, env vars
```

## Nguồn sự thật — đọc trước khi code

| File | Dùng khi |
|---|---|
| `spec.md` | Schema §2, index/trigger §2.3, API §4, SM-2 §5, import §6 |
| `flashcard-project-plan.md` | Cấu trúc thư mục §8, API inventory §4, Redis §6, roadmap §9, perf Giai đoạn 2 |
| `README.md` | Chạy local, biến môi trường, branching |

**Đồng bộ docs:** `spec.md` và `flashcard-project-plan.md` phải khớp §2.2–2.3 (schema, index, FTS, trigger). Sửa schema → cập nhật **cả hai** trước khi viết migration mới.

**Không sửa** file migration Flyway đã chạy — chỉ thêm `V{n}__*.sql`.

## Nghiệp vụ chính

- **Deck/Card:** soft-delete, `deck_tags` (nhãn cá nhân), `deck_topics` (topic hệ thống Admin), copy deck công khai
- **SRS:** `user_card_review` có `deck_id` denormalized; rating AGAIN/HARD/GOOD/EASY → SM-2
- **Quiz:** `quiz_questions` lưu sẵn, `quiz_attempts` + `quiz_answers`
- **Progress:** `user_deck_progress` denormalized; `daily_activity` heatmap; streak scheduler 00:01
- **Async:** `TaskDispatcher` → `SpringAsyncDispatcher`; `async_jobs` + Redis `job:{jobId}`
- **Search:** `search_vector` generated column (`simple` config), không expression index runtime

Chi tiết schema, index, trigger: [reference.md](reference.md)

## Quy tắc triển khai nhanh

### Schema / migration

- UUID PK; composite PK cho junction (`deck_topics`, `deck_tags`, `user_card_review`, `user_deck_progress`, `daily_activity`)
- `BaseEntity` / `SoftDeleteEntity` chỉ ở JPA — SQL migration viết đủ cột
- Gán `user_card_review.deck_id` khi tạo review (copy, first review, import)
- Trigger `trg_cards_sync_total` giữ `user_deck_progress.total_cards` đồng bộ

### Backend hot paths

| Endpoint | Query / pattern |
|---|---|
| `GET /review/due?deckId=` | `user_card_review` WHERE `user_id`, `deck_id`, `next_review_at` — dùng `idx_ucr_user_deck_due` |
| `GET /decks?topicId=` | JOIN `deck_topics` — `idx_deck_topics_topic` |
| `GET /decks/{id}/cards` | `page`/`size` default 50; `idx_cards_deck_sort` |
| `POST /review/{cardId}/rate` | Một `@Transactional`: review + daily_activity + xp + deck progress |
| `GET /leaderboard` | Redis sorted set `ZADD`/`ZREVRANGE`; fallback `idx_users_xp_leaderboard` |
| Streak scheduler | `WHERE last_study_date < CURRENT_DATE - 1` + `idx_users_last_study` |

HikariCP VPS 2GB: `maximum-pool-size: 10`, `minimum-idle: 2`.

### Frontend

- Axios interceptor: JWT + silent refresh qua cookie
- React Query cho server state; Zustand cho UI/auth nhẹ
- Poll `GET /api/v1/jobs/{jobId}` mỗi 2s cho AI/import

## Roadmap (§9 plan)

| Giai đoạn | Trọng tâm |
|---|---|
| 1 | Docker Compose, cấu trúc repo |
| 2 | Backend đầy đủ (schema, auth, SRS, quiz, async) |
| 3 | Frontend SPA |
| 4 | Test + Docker prod |
| 5–6 | Deploy VPS + vận hành |

Khi task không rõ phạm vi → xác định giai đoạn hiện tại trong plan trước khi mở rộng scope.

## Workflow khi nhận task

1. Đọc `spec.md` + `flashcard-project-plan.md` liên quan
2. Nếu đụng DB → kiểm tra §2.3 index; không thêm query JOIN `cards` chỉ để lọc deck trên SRS
3. Implement theo cấu trúc package hiện có (`controller` → `service` → `repository`)
4. Cập nhật docs nếu đổi schema/API
5. Chạy test / migration verify trước khi kết thúc

## Skill vs rule

- **Skill** (file này): ngữ cảnh nghiệp vụ, schema, workflow
- **Rules** (`.cursor/rules/lumotus-*.mdc`): convention code BE/FE tự động áp dụng
