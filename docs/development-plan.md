# Kế hoạch triển khai code — Lumotus

Thứ tự sprint ngắn gọn. **Tiến độ thực tế:** cập nhật tại [`progress.md`](progress.md).

**Đặc tả kỹ thuật:** [`spec.md`](spec.md) · **UI:** [`ui-design-plan.md`](ui-design-plan.md)

---

## Sprint 0 — Nền tảng (1–2 ngày)

**Branch:** `feature/db-v1-init-schema`

| # | Task |
|---|---|
| 1 | `docker compose up -d` + `.env` |
| 2 | `backend/.../db/migration/V1__init.sql` |
| 3 | `BaseEntity`, `SoftDeleteEntity`, `JpaConfig`, `GlobalExceptionHandler` |
| 4 | FE: light `index.css`, `axiosClient`, `MainLayout` shell |

**Done khi:** Flyway SUCCESS; FE hiện layout sáng.

---

## Sprint 1 — Auth (3–4 ngày)

**Branch:** `feature/auth-login`

- BE: Register/Login, JWT 15m, Redis refresh 7d, `GET /me`, RBAC skeleton
- FE: `LoginPage`, `RegisterPage`, interceptor silent refresh, `PrivateRoute`

---

## Sprint 1b — Google OAuth (2–3 ngày, sau Sprint 1)

**Branch:** `feature/auth-google-oauth`

| # | Task |
|---|---|
| 1 | Google Cloud Console: OAuth client (Web), redirect URI `http://localhost:3000` + prod |
| 2 | Migration `V2`: `users.oauth_provider`, `users.oauth_subject` (nullable); unique `(oauth_provider, oauth_subject)` |
| 3 | BE: `spring-boot-starter-oauth2-client` hoặc verify Google ID token; `POST /api/v1/auth/google` |
| 4 | Luồng: FE Google button → credential → BE verify email → tạo/link `users` → JWT + refresh cookie (giống login) |
| 5 | FE: nút "Đăng nhập với Google" trên Login/Register (`@react-oauth/google` hoặc GIS) |
| 6 | `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |

**Done khi:** Đăng nhập Google lần đầu tạo user; lần sau vào đúng tài khoản; logout vẫn xóa Redis refresh.

---

## Sprint 2 — Deck & Card (4–5 ngày)

**Branch:** `feature/deck-card-crud`

- BE: Topic, Deck, Card, copy deck, FTS, pagination cards (default 50)
- FE: `ExplorePage`, `DashboardPage`, `DeckDetailPage`
- Dev: `ADMIN_BOOTSTRAP_EMAIL` — tự gán ADMIN khi startup (đăng nhập lại sau promote)

---

## Sprint 2b — Slug URLs (2–3 ngày, sau Sprint 2 ổn định)

**Branch:** `feature/deck-quiz-slug`

| Entity | Hiện tại | Mục tiêu |
|---|---|---|
| Topic | đã có `slug` | Path/filter: `/topics/{slug}`, `?topicSlug=` |
| Deck | chỉ UUID | Migration `slug`, unique `(owner_id, slug)`; path `/decks/{slug}` |
| Quiz | chỉ UUID | `quiz_attempts` hoặc session slug khi triển khai Sprint 4 |
| Card | giữ UUID | Path nested: `/decks/{deckSlug}/cards/{cardId}` |

- Cập nhật `spec.md` + `flashcard-project-plan.md` §2.2 trước migration
- API hybrid: nhận slug hoặc UUID; response luôn trả `id` + `slug`
- FE routing dùng slug; logic nội bộ vẫn có UUID

---

## Sprint 3 — SRS Review (4–5 ngày)

**Branch:** `feature/review-srs`

- BE: `Sm2Algorithm`, `ReviewService` (một `@Transactional` khi rate), `deck_id` trên review
- FE: `ReviewPage`, `FlashCard` flip, `RatingButtonGroup`

---

## Sprint 4 — Quiz & Progress (4–5 ngày)

**Branch:** `feature/quiz-progress`

- Quiz session + score + XP
- Heatmap, streak, stats, leaderboard Redis ZSET

---

## Sprint 5 — Async & Media (3–4 ngày)

**Branch:** `feature/async-import-ai`

- CSV import, AI generate, Cloudinary upload, job polling

---

## Sprint 6 — Admin & Polish (2–3 ngày)

**Branch:** `feature/admin-polish`

- Admin topics/users/stats
- 10+ MockMvc tests, responsive QA

---

## MVP demo (~4 tuần)

Đăng ký → tạo deck + thẻ → ôn SRS → quiz → leaderboard.

---

## Không làm giai đoạn đầu

- Role TEACHER / classroom
- RabbitMQ (dùng `@Async` trước)
- Dark mode UI
