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
| 2 | 2 + 3 | Deck/Card/Topic CRUD, copy deck; FE Explore/Dashboard/Thư viện/DeckDetail | ✅ Xong |
| 2c | 2 | Trang chủ Quizlet-style, `source_deck_id` (V5), phân trang + tìm thẻ | ✅ Xong |
| 2b | 2 | Slug URLs (`V3`), `{deckRef}`, `topicSlug` | ✅ Xong |
| 3 | 2 | **Import CSV** + **Media upload** (Cloudinary) — *trước SRS, theo §9* | ✅ Xong |
| 4 | 2 + 3 | SRS SM-2, Review UI, starred, audio | ✅ MVP |
| 4b | 2 + 3 | Dark theme UI + ảnh nền cho toàn bộ hệ thống | ✅ Xong |
| 5 | 2 + 3 | Study Modes (Flashcard/Quiz/Learn/Spell) ✅ · Session persistence ✅ · Components ✅ · Mode switch ✅ · Progress/Leaderboard ⏳ | 🔄 Đang |
| 6 | 2 + 3 + 4 | AI generate (async jobs), Admin UI, MockMvc ≥8, Swagger đầy đủ, polish | ⏳ Chưa |

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

## Sprint 2 — Deck & Card ✅

**Branch:** `feature/deck-card-crud` (đã merge phần lớn)

### Backend ✅

- Topic CRUD (ADMIN), Deck & Card CRUD, copy deck, pagination cards (default 50)
- `ADMIN_BOOTSTRAP_EMAIL` — promote ADMIN khi startup (dev)
- FTS `q`: LIKE title/description (nâng cấp `search_vector` — tùy chọn)

### Frontend ✅

- `ExplorePage`, `DashboardPage` (`/home`), `LibraryPage` (`/library`), `DeckDetailPage` — slug URL
- Trang chủ kiểu Quizlet: chào + XP/streak, hero «Tiếp tục học», strip «Gần đây» + «Gợi ý tham khảo»
- Thư viện = quản lý deck (CRUD, import); Khám phá = deck công khai cộng đồng
- API client deck/card/topic + React Query
- Tạo deck, CRUD thẻ (owner), copy deck công khai
- `EditDeckDialog`, badge «Copy từ …» khi deck có `source_deck_id`

**Done khi:** CRUD deck/card end-to-end trên UI ✅ · list explore lọc `topicSlug` ✅ · chỉ deck public trên Khám phá ✅

---

## Sprint 2b — Slug URLs ✅ (backend)

**Branch:** gộp `feature/deck-card-crud`

| # | Task | |
|---|---|---|
| 1 | `V3__decks_slug.sql` + `idx_decks_owner_slug` | ✅ |
| 2 | `SlugUtils`; path `{deckRef}` = UUID hoặc slug | ✅ |
| 3 | Topic `GET/PUT/DELETE /topics/{slug}`; `?topicSlug=` | ✅ |
| 4 | Response deck có `id` + `slug` | ✅ |
| 5 | FE routes dùng slug | ✅ |

**Quiz slug (`attemptRef`):** thiết kế trong `spec.md` — implement Sprint 5.

---

## Sprint 2c — Home UX & nguồn gốc deck ✅

**Branch:** gộp trên `develop`

| # | Task | |
|---|---|---|
| 1 | `V5__decks_source_deck.sql` — `decks.source_deck_id`; gán khi `copyDeck` | ✅ |
| 2 | `DeckSummaryResponse`: `sourceDeckId`, `sourceDeckSlug`, `sourceDeckTitle`, `sourceOwnerUsername` | ✅ |
| 3 | FE `/home` Dashboard Quizlet-style; `/library` quản lý deck | ✅ |
| 4 | `DeckCard` + `DeckDetailPage` hiển thị nguồn gốc copy | ✅ |
| 5 | Phân trang thẻ 50/trang + tìm `front`/`back`/`phonetic` | ✅ |

*Copy trước V5 không có lineage — cần copy lại sau migration.*

---

## Sprint 3 — Import & Media ✅

**Branch:** `feature/async-import-media`

> Theo **flashcard §9 Giai đoạn 2**: Import CSV và Media upload **trước** SRS — phục vụ ảnh card, avatar (`PUT /me`), cover deck.

| # | Task | |
|---|---|---|
| 1 | `POST /api/v1/media/upload` → Cloudinary (`avatars/`, `cards/`, `decks/`) | ✅ |
| 2 | `POST /api/v1/decks/import` — CSV sync, max 500 thẻ | ✅ |
| 3 | Upsert trùng `front` trong deck (ưu tiên lần import sau) | ✅ |
| 4 | Header CSV: `front, back, phonetic, example, hint, image_url, icon` | ✅ |
| 5 | FE: upload avatar profile; ảnh card; import Home + DeckDetail | ✅ |

*Excel/DOCX, AI generate → Sprint 6.*

---

## Sprint 4 — SRS Review ✅ *(MVP xong; polish Sprint 6)*

**Branch:** `feature/review-srs`

| # | Task | |
|---|---|---|
| 1 | BE: `Sm2Algorithm`, `ReviewService`, `deck_id` denormalized | ✅ |
| 2 | BE: `GET /review/due`, `POST .../rate`, `POST .../star`, `starredOnly` | ✅ |
| 3 | FE: `ReviewPage`, flip 3D, `RatingButtonGroup`, xáo trộn | ✅ |
| 4 | FE: audio upload (4a) + nút phát (4b) | ✅ |
| 5 | FE: Dashboard due CTA | ✅ |
| 6 | Streak scheduler | ⏳ |

> **Đối chiếu đề tài:** [`spec.md`](spec.md) §8

---

## Sprint 4b — Dark Theme UI ✅

**Branch:** `style/english-learning-ui`

> Giao diện dark theme + ảnh nền cho toàn bộ hệ thống.

| # | Task | Trạng thái |
|---|---|---|
| 1 | `MainLayout.tsx` — ảnh hero mờ 6%, gradient overlay `#1A1520`, full-width | ✅ |
| 2 | `LibraryPage.tsx` — dark surface, full-width, grid 4 cột | ✅ |
| 3 | `ExplorePage.tsx` — search bar + cards dark, grid 4 cột | ✅ |
| 4 | `DeckDetailPage.tsx` — header + card panel dark | ✅ |
| 5 | `ReviewPage.tsx` + `ReviewFlashcard.tsx` — dark gradient + glass | ✅ |
| 6 | `DeckCard.tsx` + `CardGridItem.tsx` — dark glass card | ✅ |
| 7 | `index.css` — `.review-card-inner` dark glass, review card faces | ✅ |
| 8 | `LandingPage.tsx` — Section 2 & 3 dark, header nav links scroll thật | ✅ |
| 9 | Build pass | ✅ |
| 10 | Commit code | ⏳ |

**Design tokens (dark theme):**

| Token | Giá trị |
|---|---|
| Background | `#1A1520` |
| Surface | `#252030` (80% opacity glass) |
| Elevated | `#2D2538` |
| Border | `#3D3348` / `#4A4060` |
| Text primary | `#F5F0FA` |
| Text secondary | `#C4B8D9` |
| Text muted | `#8B7A9E` |
| Primary | `#EC4899` (pink) |
| Accent | `#F97316` (orange) |
| Glow shadow | `rgba(236,72,153,0.15)` |

---

## Roadmap âm thanh từ vựng *(song song Sprint 4–5)*

Schema đã có `cards.audio_url` (`spec.md` §2.2). Triển khai theo pha — **không chặn SRS**.

| Pha | Phạm vi | Ghi chú |
|---|---|---|
| **4a** | Upload audio qua `POST /media/upload` — folder Cloudinary `audio/`; gán `audio_url` khi tạo/sửa thẻ | Mở rộng `MediaFolder`; giới hạn MIME mp3/wav/ogg |
| **4b** | Review UI: nút 🔊 trên flashcard; preload khi lật thẻ | Dùng `<audio>` + fallback toast nếu URL lỗi |
| **5a** | CSV import cột `audio_url` (optional) | Cùng upsert theo `front` |
| **5b** | TTS async (optional): job tạo audio từ `front` — Google Cloud TTS hoặc provider tương đương | `async_jobs`; không block request sync |
| **6** | Chế độ «Nghe & đánh vần» trong quiz — phonetic + audio | Phụ thuộc quiz session Sprint 5 |

**Ưu tiên MVP:** 4a + 4b (upload + phát trong Review). TTS và quiz nghe để Sprint 5–6.

---

## Sprint 5 — Study Modes & Progress 🔄

**Branch:** `feature/quiz-progress` · `feature/study-session` · `feature/progress-leaderboard`

### Backend — Study Modes ✅ *(done)*

| # | Task | Trạng thái |
|---|---|---|
| 1 | `StudyMode` enum (`FLASHCARD`, `QUIZ`) | ✅ |
| 2 | `StudyAttempt` in-memory model + `QuestionGenerator` | ✅ |
| 3 | `StudyController`: `POST /study/{deckRef}/start`, `POST /{attemptId}/submit`, `GET /{attemptId}/result` | ✅ |
| 4 | Question generation: FLASHCARD (due cards), QUIZ (MCQ) | ✅ |
| 5 | Scoring + XP: `daily_activity`, `users.xp` | ✅ |
| 6 | Session persistence (frontend `studySession.ts`) — TTL, resume dialog, config per mode | ✅ |
| 7 | Heatmap + streak scheduler (`@Scheduled`, cron `0 0 * * *`) | ⏳ |
| 8 | Redis leaderboard: composite score (XP + streak), `ZREVRANGE` top N | ⏳ |
| 9 | Progress API: `GET /progress/me`, `GET /progress/leaderboard` | ⏳ |

### Frontend — Study Modes ✅ *(done)*

| # | Task | Trạng thái |
|---|---|---|
| 1 | `StudyPage.tsx` — unified page: config → session → result | ✅ |
| 2 | `ModeTab.tsx` — 4 mode tabs with icons | ✅ |
| 3 | `QuizView.tsx` — MCQ options with correct/wrong highlight | ✅ |
| 4 | `QuizView.tsx` — MCQ options with correct/wrong highlight | ✅ |
| 5 | Component extraction: 9 components tách từ StudyPage (975 → 365 dòng) | ✅ |
| 6 | Quiz UX: auto-advance default, timeout auto-submit, wrong answers Levenshtein | ✅ |
| 15 | `ProgressPage.tsx` — heatmap, streak, stats | ⏳ |
| 16 | `LeaderboardPage.tsx` — top N by XP | ⏳ |

### Design — Study UI

- 2 mode tabs: Flashcard (Layers), Quiz (FileText)
- Active tab: gradient pink→orange pill + glow shadow
- Quiz options: 2-col grid, correct=green border, wrong=red border
- Result: score ring (SVG circle with gradient), XP badge
- Session persistence: TTL options (5m → 3d), "Tiếp tục?" dialog, config per mode

---

## Sprint 6 — AI, Admin & Polish ⏳

**Branch:** `feature/admin-polish`

- `POST /api/v1/decks/generate` + `async_jobs` + polling `GET /jobs/{jobId}`
- Admin: users, topics, stats
- 8+ MockMvc tests (Auth, Deck, Card, Review, Study) — **yêu cầu đề tài ≥8**; responsive QA; Swagger annotate đầy đủ

---

## MVP demo (~4 tuần)

Đăng ký → tạo/import deck + thẻ → upload ảnh → ôn SRS → Study modes → leaderboard.

---

## Không làm giai đoạn đầu

- Role TEACHER / classroom
- RabbitMQ (dùng `@Async` trước)
- ~~Dark mode UI~~ — **đã làm Sprint 4b** ✅

---

## Đồng bộ tài liệu (khi có thay đổi)

| Loại thay đổi | Cập nhật |
|---|---|
| Schema / index / migration mới | `spec.md` §2.2–2.3 **và** `flashcard-project-plan.md` §2.2–2.3 → rồi `V{n}__*.sql` |
| API endpoint mới/đổi | `spec.md` §4 **và** `flashcard-project-plan.md` §4 |
| Thứ tự sprint / giai đoạn | `flashcard-project-plan.md` §9 trước → `development-plan.md` → `progress.md` |
| Xong task trong buổi | `progress.md` checkbox + session log |
| Env / tooling mới | `.env.example`, `README.md` (nếu quick start đổi) |

*Cập nhật lần cuối: 2026-06-29 · Đối chiếu đề tài: [`spec.md`](spec.md) §8*
