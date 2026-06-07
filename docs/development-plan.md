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

**Branch:** `feature/auth-jwt-login`

- BE: Register/Login, JWT 15m, Redis refresh 7d, `GET /me`, RBAC skeleton
- FE: `LoginPage`, `RegisterPage`, interceptor silent refresh, `PrivateRoute`

---

## Sprint 2 — Deck & Card (4–5 ngày)

**Branch:** `feature/deck-card-crud`

- BE: Topic, Deck, Card, copy deck, FTS, pagination cards (default 50)
- FE: `ExplorePage`, `DashboardPage`, `DeckDetailPage`

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
