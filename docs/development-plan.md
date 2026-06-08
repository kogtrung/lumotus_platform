# Kế hoạch triển khai code — Lumotus

Thứ tự sprint **căn theo** [`flashcard-project-plan.md`](flashcard-project-plan.md) §9 (Giai đoạn 1–3).  
**Tiến độ thực tế & session log:** [`progress.md`](progress.md) · **Đặc tả API/schema:** [`spec.md`](spec.md)

> **Nguyên tắc:** `flashcard-project-plan.md` = lộ trình & thứ tự nghiệp vụ (Import trước SRS, Media trước avatar upload…).  
> File này = chia nhỏ thành sprint code + branch. Khi lệch thứ tự giữa hai file → **ưu tiên sửa `development-plan.md` cho khớp §9**, rồi cập nhật checkbox `progress.md`.

---

## Bản đồ sprint ↔ Giai đoạn (flashcard §9)

| Sprint | Giai đoạn | Phạm vi chính | Trạng thái |
|---|---|---|---|
| 0 | 1 | Docker, Flyway V1, FE shell | ✅ Xong |
| 1 | 2 | Auth JWT, refresh, RBAC, `GET/PUT /me`, đổi mật khẩu | ✅ Xong |
| 1b | 2 | Google OAuth (`V2`), FE nút Google | ✅ Xong |
| 2 | 2 + 3 | Deck/Card/Topic CRUD, copy deck; FE Explore/Dashboard/DeckDetail | 🔄 BE xong, FE chưa |
| 2b | 2 | Slug URLs (`V3`), `{deckRef}`, `topicSlug` | ✅ BE xong |
| 3 | 2 | **Import CSV** + **Media upload** (Cloudinary) — *trước SRS, theo §9* | ⏳ Chưa |
| 4 | 2 + 3 | SRS SM-2, Review UI, starred | ⏳ Chưa |
| 5 | 2 + 3 | Quiz, heatmap, streak, stats, leaderboard | ⏳ Chưa |
| 6 | 2 + 3 + 4 | AI generate (async jobs), Admin UI, MockMvc, polish | ⏳ Chưa |

**Đã làm ngoài sprint gốc (ghi nhận):** `scripts/ensure-jwt-secret.mjs`, `ADMIN_BOOTSTRAP_EMAIL`, Postman collection, `vite.config` `envDir` monorepo.

---

## Sprint 0 — Nền tảng ✅

**Branch gộp:** `feature/init-database-and-layout` (đã merge)

| # | Task | |
|---|---|---|
| 1 | `docker compose up -d` + `.env` | ✅ |
| 2 | `V1__init.sql` — 13 bảng, index, FTS, trigger | ✅ |
| 3 | `BaseEntity`, `SoftDeleteEntity`, `JpaConfig`, `GlobalExceptionHandler` | ✅ |
| 4 | FE: `index.css`, `axiosClient`, `MainLayout` | ✅ |
| 5 | Flyway SB4: `spring-boot-starter-flyway` | ✅ |

---

## Sprint 1 — Auth ✅

**Branch:** `feature/auth-login`

| # | Task | |
|---|---|---|
| 1 | Register / Login / Refresh / Logout | ✅ |
| 2 | JWT 15m + Redis refresh 7d | ✅ |
| 3 | `GET /api/v1/auth/me` | ✅ |
| 4 | `PUT /api/v1/auth/me` — username, avatarUrl | ✅ |
| 5 | `PUT /api/v1/auth/me/password` | ✅ |
| 6 | RBAC skeleton (`USER` / `ADMIN`) | ✅ |
| 7 | FE: Login, Register, silent refresh, `PrivateRoute` | ✅ |

---

## Sprint 1b — Google OAuth ✅

**Branch:** gộp trong `feature/auth-login`

| # | Task | |
|---|---|---|
| 1 | `V2__users_oauth.sql` | ✅ |
| 2 | `POST /api/v1/auth/google` + verify ID token | ✅ |
| 3 | FE: `@react-oauth/google`, `VITE_GOOGLE_CLIENT_ID` | ✅ |
| 4 | `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ✅ |

---

## Sprint 2 — Deck & Card 🔄

**Branch:** `feature/deck-card-crud`

### Backend ✅

- Topic CRUD (ADMIN), Deck & Card CRUD, copy deck, pagination cards (default 50)
- `ADMIN_BOOTSTRAP_EMAIL` — promote ADMIN khi startup (dev)
- FTS `q`: LIKE title/description (nâng cấp `search_vector` — tùy chọn)

### Frontend ⏳ → ✅ (MVP Sprint 2)

- `ExplorePage`, `DashboardPage` (Home), `DeckDetailPage` — slug URL
- API client deck/card/topic + React Query
- Tạo deck, CRUD thẻ (owner), copy deck công khai

**Done khi:** ~~CRUD deck/card end-to-end trên UI~~ ✅ · list explore lọc `topicSlug` ✅

---

## Sprint 2b — Slug URLs ✅ (backend)

**Branch:** gộp `feature/deck-card-crud`

| # | Task | |
|---|---|---|
| 1 | `V3__decks_slug.sql` + `idx_decks_owner_slug` | ✅ |
| 2 | `SlugUtils`; path `{deckRef}` = UUID hoặc slug | ✅ |
| 3 | Topic `GET/PUT/DELETE /topics/{slug}`; `?topicSlug=` | ✅ |
| 4 | Response deck có `id` + `slug` | ✅ |
| 5 | FE routes dùng slug | ⏳ Sprint 2 FE |

**Quiz slug (`attemptRef`):** thiết kế trong `spec.md` — implement Sprint 5.

---

## Sprint 3 — Import & Media ⏳

**Branch:** `feature/async-import-media` (hoặc tách `feature/media-upload`)

> Theo **flashcard §9 Giai đoạn 2**: Import CSV và Media upload **trước** SRS — phục vụ ảnh card, avatar (`PUT /me`), cover deck.

| # | Task |
|---|---|
| 1 | `POST /api/v1/media/upload` → Cloudinary (`avatars/`, `cards/`, `decks/`) |
| 2 | `POST /api/v1/decks/import` — CSV (OpenCSV), sync hoặc job nhẹ |
| 3 | Header CSV: `front, back, phonetic, example, hint, image_url, icon` |
| 4 | FE: upload avatar trong profile; ảnh card trên DeckDetail |

*Excel/DOCX, AI generate → Sprint 6.*

---

## Sprint 4 — SRS Review ⏳

**Branch:** `feature/review-srs`

- BE: `Sm2Algorithm`, `ReviewService` (`@Transactional` khi rate), `deck_id` trên review
- FE: `ReviewPage`, flip card, `RatingButtonGroup`, starred

---

## Sprint 5 — Quiz & Progress ⏳

**Branch:** `feature/quiz-progress`

- Quiz session, score, XP; `quiz_attempts.slug` (optional `attemptRef`)
- Heatmap, streak, stats; leaderboard Redis ZSET
- FE: Quiz, Progress, Leaderboard

---

## Sprint 6 — AI, Admin & Polish ⏳

**Branch:** `feature/admin-polish`

- `POST /api/v1/decks/generate` + `async_jobs` + polling `GET /jobs/{jobId}`
- Admin: users, topics, stats
- 10+ MockMvc tests; responsive QA; Swagger hoàn thiện

---

## MVP demo (~4 tuần)

Đăng ký → tạo/import deck + thẻ → upload ảnh → ôn SRS → quiz → leaderboard.

---

## Không làm giai đoạn đầu

- Role TEACHER / classroom
- RabbitMQ (dùng `@Async` trước)
- Dark mode UI

---

## Đồng bộ tài liệu (khi có thay đổi)

| Loại thay đổi | Cập nhật |
|---|---|
| Schema / index / migration mới | `spec.md` §2.2–2.3 **và** `flashcard-project-plan.md` §2.2–2.3 → rồi `V{n}__*.sql` |
| API endpoint mới/đổi | `spec.md` §4 **và** `flashcard-project-plan.md` §4 |
| Thứ tự sprint / giai đoạn | `flashcard-project-plan.md` §9 trước → `development-plan.md` → `progress.md` |
| Xong task trong buổi | `progress.md` checkbox + session log |
| Env / tooling mới | `.env.example`, `README.md` (nếu quick start đổi) |

*Cập nhật lần cuối: 2026-06-08*
