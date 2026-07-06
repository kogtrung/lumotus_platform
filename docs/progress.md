# Tiến độ dự án — Lumotus

File theo dõi **session làm việc**: đã xong gì, đang ở đâu, làm tiếp gì.  
Cập nhật **cuối mỗi buổi** (hoặc khi merge PR quan trọng).

> Chỉ ghi **công việc chính** (code, schema, docs, thiết kế). Không ghi thao tác chạy app (`docker compose`, `mvn`, `npm run dev`…).  
> Khi session xong: thêm **Nhánh gợi ý** ngay bên dưới.

**Sprint chi tiết:** [`development-plan.md`](development-plan.md) (căn theo [`flashcard-project-plan.md`](flashcard-project-plan.md) §9)

### Quy ước tên nhánh

```
<type>/<module>-<mô-tả-ngắn>
```

| Type | Khi dùng |
|---|---|
| `feature/` | Tính năng / nền tảng mới |
| `fix/` | Sửa bug |
| `style/` | UI, layout (không đổi logic) |
| `docs/` | Tài liệu |
| `chore/` | Infra, tooling, config |

- **Module** trùng commit (`auth`, `db`, `core`, `deck`, `docs`, `infra`…) — xem [`lumotus-commits`](../.cursor/rules/lumotus-commits.mdc)
- **Mô tả:** kebab-case, 2–4 từ, nói *kết quả* — tránh version (`v1`), tên kỹ thuật dài
- **Docs:** ưu tiên trùng tên file chính trong `docs/` (vd. `spec.md` → `docs/spec-and-project-plan`), không đặt tên file không tồn tại
- Không đặt theo sprint; không dùng `BE`/`FE` trong tên nhánh

---

## Trạng thái hiện tại

| Mục | Giá trị |
|---|---|
| **Giai đoạn** | Sprint 6 — AI generate, Admin, Polish |
| **Branch** | `develop` |
| **Sprint đang focus** | Sprint 6: AI generate, Admin UI, MockMvc tests |
| **Việc tiếp theo** | AI generate deck, Admin dashboard |
| **Đối chiếu đề tài** | [`spec.md`](spec.md) §8 |
| **Cập nhật lần cuối** | 2026-07-03 |

### Tóm tắt nhanh

- **Đã ổn định:** Auth, Deck/Card, Import CSV, Media upload, SRS Review + audio, Study Modes (Flashcard/Quiz), session persistence + resume dialog
- **Đã hoàn thành Sprint 5:** Progress heatmap 365d, Streak scheduler, Leaderboard Redis ZSET + `/progress/leaderboard` endpoint
- **Chưa triển khai:** Admin UI, AI generate, MockMvc tests — Sprint 6

### Nhánh gợi ý (đợt này)

| Phạm vi | Nhánh |
|---|---|
| Progress/Leaderboard | `feature/progress-leaderboard` |

---

## Checklist theo sprint

### Sprint 0 — Nền tảng ✅

- [x] `V1__init.sql` (13 bảng, index, `search_vector`, trigger `total_cards`)
- [x] `BaseEntity`, `SoftDeleteEntity`, `JpaConfig`, `GlobalExceptionHandler`
- [x] Flyway tích hợp Spring Boot 4 (`spring-boot-starter-flyway`)
- [x] Backend đọc biến môi trường từ `.env` gốc monorepo
- [x] FE: light tokens `index.css`, `axiosClient`, `MainLayout` shell

### Sprint 1 — Auth ✅

- [x] JWT + Redis refresh + Auth API (`register`, `login`, `refresh`, `logout`, `me`)
- [x] `PUT /me` (username, avatarUrl), `PUT /me/password`
- [x] Login / Register FE + silent refresh + `PrivateRoute`
- [x] Fix refresh cookie (path `/`, Vite proxy) + sessionStorage accessToken

### Sprint 1b — Google OAuth ✅

- [x] Migration `V2__users_oauth.sql`
- [x] `POST /api/v1/auth/google` + verify Google ID token
- [x] FE: nút Google trên Login/Register (`@react-oauth/google`)

### Sprint 2 — Deck & Card ✅

- [x] BE: entities Topic / Deck / Card / DeckTopic + repositories
- [x] BE: Topic CRUD (ADMIN), Deck & Card CRUD + copy deck
- [x] Fix update deck `topicIds` + `deleteAllByDeckId` query
- [x] `ADMIN_BOOTSTRAP_EMAIL` — promote user thành ADMIN (dev)
- [ ] FTS search (`q`) nâng cao qua `search_vector`
- [x] Explore, Dashboard (`/home`), Library (`/library`), DeckDetail FE
- [x] API client deck/card/topic + React Query
- [x] `V5__decks_source_deck.sql` — lineage khi copy deck
- [x] Trang chủ Quizlet-style; sidebar icon ↔ có chữ; logo cánh sen; header search
- [x] `EditDeckDialog`; phân trang + search thẻ; nguồn gốc copy (V5)

### Sprint 2b — Slug URLs ✅

- [x] Docs: `spec.md` + plan — `decks.slug`; quiz slug ghi chú Sprint 5
- [x] Migration `V3__decks_slug.sql` + index `idx_decks_owner_slug`
- [x] `SlugUtils`, deck path `{deckRef}` hybrid UUID/slug
- [x] Topic `GET/PUT/DELETE /topics/{slug}`; filter `?topicSlug=`
- [ ] Quiz `attemptRef` slug — Sprint 5
- [x] FE routes dùng slug (`/decks/:deckRef`)

### Sprint 3 — Import & Media ✅

- [x] `POST /media/upload` (Cloudinary, `MediaFolder`)
- [x] `POST /decks/import` CSV (sync, max 500 thẻ)
- [x] Import **upsert** trùng `front` trong deck (ưu tiên lần import sau; `addedCount` / `updatedCount`)
- [x] FE: upload avatar (`/settings`), ảnh card, import CSV Library + DeckDetail
- [x] `EditDeckDialog` — sửa deck, bật công khai, gắn topic
- [x] Khám phá chỉ deck public; Thư viện = deck của tôi; hiển thị `ownerUsername`
- [x] Lưới thẻ compact (5 cột desktop); phân trang 50/trang + tìm thẻ
- [x] Roadmap audio: upload `audio/` + phát trong Review (xem `development-plan.md`)

### Sprint 4 — SRS Review ✅

- [x] BE: `Sm2Algorithm` + unit test
- [x] BE: entities/repos `user_card_review`, `user_deck_progress`, `daily_activity`
- [x] BE: `ReviewService` — due (thẻ mới + đến hạn), rate, star; XP + daily_activity
- [x] BE: `ReviewController` — `GET /review/due`, `POST /review/{cardId}/rate|star`
- [x] FE: `ReviewPage` — flip thẻ, `RatingButtonGroup`, star, `/decks/:deckRef/review`
- [x] FE: nút phát `audio_url` (pha 4b) + upload audio (pha 4a)
- [x] FE: filter ôn chỉ thẻ starred (`?starredOnly=true`)
- [x] FE: dark theme + full-width layout
- [ ] Streak scheduler

### Sprint 4b — Dark Theme UI ✅

- [x] `MainLayout.tsx` — background ảnh hero mờ, gradient overlay, full-width
- [x] `LibraryPage`, `ExplorePage`, `DeckDetailPage` — dark theme
- [x] `ReviewPage`, `ReviewFlashcard`, `CardGridItem` — dark theme
- [x] `DeckCard`, `DeckGridSkeleton` — dark glass
- [x] `LandingPage` — Section 2 & 3 dark, header scroll links
- [x] `index.css` — `.review-card-inner` dark glass

### Sprint 5 — Study Modes & Progress ✅

- [x] Study Modes BE: `StudyMode` enum, `StudyAttempt` in-memory, `QuestionGenerator`, `StudyController`, `StudyService`
- [x] Study Modes FE: `StudyPage`, `ModeTab`, `QuizView`, `FlashCard`, `/decks/:deckRef/study` route
- [x] 2 modes: Flashcard (SRS), Quiz (MCQ)
- [x] Score + XP: `daily_activity`, `users.xp` update on submit
- [x] Session persistence: `studySession.ts` — TTL, resume dialog, config per mode
- [x] StudyPage component extraction: 9 components tách từ StudyPage.tsx
- [x] Mode switch fix: FLASHCARD → QUIZ auto-starts session
- [x] Quiz: auto-advance ON by default, auto-submit on timeout, prevent answers after expired
- [x] Quiz: wrong answers improved (Levenshtein distance, different cards)
- [x] FlashCard: TTL toggle ON/OFF, default 60 minutes
- [x] ResumeDialog: close button to dismiss without choosing
- [x] Result screen: scrollable with `overflow-y-auto`
- [x] Quiz CRUD BE: create/update/delete quiz & questions
- [x] Quiz Explore: newest/popular/trending + leaderboard
- [x] Quiz Admin: import CSV, moderate (approve/reject), CRUD questions
- [x] Quiz slug: `V15__quizzes_add_slug.sql` + `SlugUtils`
- [x] V16: fix `last_rating` type VARCHAR → SMALLINT
- [x] Quiz Anti-Cheat Plan: `docs/quiz-anti-cheat-plan.md`
- [x] Heatmap FE (`ProgressPage.tsx`) — real data từ API
- [x] Streak scheduler BE (`@Scheduled`) — 01:00 UTC reset
- [x] Leaderboard Redis ZSET BE — `LeaderboardService` composite score
- [x] Progress API BE: `GET /progress/me`, `GET /progress/leaderboard`
- [x] Leaderboard FE page (`/leaderboard`) + nav item

### Sprint 6 — AI, Admin & Polish ⏳

- [ ] AI generate + `async_jobs` polling
- [ ] Admin UI + MockMvc tests + responsive

---

## Nhật ký session

Ghi **mới nhất lên trên**. Mỗi entry: ngày, đã làm, chưa xong, **Next**, **Nhánh gợi ý** (nếu session đã xong phần code).

---

### Session 2026-07-03 — Progress heatmap, Streak scheduler, Global Leaderboard

**Đã làm**

- **Backend: LeaderboardService tích hợp Redis ZSET:**
  - `LeaderboardService.updateUserScore()` — gọi khi user nhận XP (flashcard rate, quiz submit)
  - `compositeScore = xp * 1000 + streak`; refresh 5 phút
  - `FlashcardService.upsertDailyActivity()` → gọi `leaderboardService.updateUserScore()`
  - `QuizService.submitQuiz()` → gọi `leaderboardService.updateUserScore()` khi quiz APPROVED + không phải owner
- **Backend: StreakService** — đã implement đầy đủ, chạy 01:00 UTC reset streak thủ công
- **Backend: ProgressService + ProgressController** — `/progress/me`, `/progress/leaderboard`, `/progress/heatmap`
- **Frontend `api/progress.ts`** — API client cho progress/heatmap/leaderboard/dashboard stats
- **Frontend `ProgressPage.tsx`** — rewrite hoàn toàn:
  - Heatmap 30 ngày thực từ API (không còn mock Math.random())
  - Rank thực `#N` từ `/progress/me`
  - Link đến `/leaderboard`
- **Frontend `LeaderboardPage.tsx`** — trang global leaderboard mới (podium top 3 + danh sách)
- **Frontend `App.tsx`** — thêm route `/leaderboard`
- **Frontend `MainLayout.tsx`** — thêm nav item "Bảng xếp hạng" (Medal icon)
- **Frontend `DashboardPage.tsx`** — StreakBanner hiển thị rank thực + thêm Trophy icon
- **Frontend `ExplorePage.tsx`** — global leaderboard sidebar dùng `progressApi.getLeaderboard()`
- **Frontend `study.ts`** — đổi tên `LeaderboardEntry` → `QuizLeaderboardEntry` (tránh confusion với global leaderboard type)
- **Fix TypeScript errors pre-existing** — `DeckDetailPage.tsx` (undefined `qc` variable), `QuizDetailPage.tsx` (`canEdit` boolean type), `QuizPlayPage.tsx` (unused import)
- **Docs sync:**
  - `spec.md` §4: cập nhật Nhóm 7 Progress/Leaderboard API + status bảng xếp hạng
  - `flashcard-project-plan.md` §9 + API table: đánh dấu Progress/Leaderboard ✅

**Build:** `npm run build` ✅ (TypeScript pass), `mvn compile` ✅

**Nhánh gợi ý**

|| Phạm vi | Nhánh |
|---|---|---|
| Progress/Leaderboard | `feature/progress-leaderboard` |

---

### Session 2026-07-03 (buổi 2) — Admin exclusion, Global Quiz Leaderboard, Streak docs

**Đã làm**

- **Fix: Loại ADMIN khỏi global leaderboard:**
  - `LeaderboardService.updateUserScore()` — kiểm tra `role == ADMIN` → `ZREM` khỏi Redis
  - `LeaderboardService.refreshLeaderboard()` — skip user có `role == ADMIN`
- **Fix: Explore sidebar → "Bảng xếp hạng Quiz" (performance-based):**
  - Backend: tạo `GlobalQuizLeaderboardEntry` DTO
  - Backend: thêm `QuizAttemptRepository.findGlobalQuizLeaderboard()` — CTE lấy best attempt per user per quiz
  - Backend: thêm `QuizService.getGlobalQuizLeaderboard()`
  - Backend: thêm `GET /quizzes/leaderboard` endpoint
  - Frontend: `study.ts` thêm `quizApi.getGlobalQuizLeaderboard()`
  - Frontend: `ExplorePage.tsx` sidebar hiện "avgBestScore + totalAttempts" thay vì XP/streak
- **Docs: Chi tiết streak flow trong `spec.md` §5.2:**
  - Điều kiện đạt streak: ≥10 thẻ HOẶC ≥1 quiz mỗi ngày
  - Logic: distance 0→giữ, 1→tăng, >1→reset về 1
  - Scheduler 01:00 UTC reset stale streaks + Admin utility `recalculateStreak()`
  - 4 phần: 5.2.1 Streak, 5.2.2 Progress, 5.2.3 Global Leaderboard, 5.2.4 Global Quiz Leaderboard
- **Fix pre-existing duplicate `getMyQuiz()` trong QuizService**
- **Docs sync:** `spec.md` Quiz status ✅, `flashcard-project-plan.md` Study Modes 2 modes ✅

**Build:** `mvn compile` ✅, `npx tsc --noEmit` ✅

---

### Session 2026-07-02 — Quiz CRUD + Admin Moderation + Anti-Cheat Plan

**Đã làm**

- **Quiz CRUD BE (`QuizService.java`, `QuizController.java`):**
  - User: create quiz, update quiz, delete quiz, add/update/delete questions
  - Public: explore (newest/popular/trending), leaderboard
  - Session: start, submit, resume, heartbeat, active sessions
  - Admin: import CSV, list pending, moderate (approve/reject), CRUD questions
- **Quiz slug (`V15__quizzes_add_slug.sql`):**
  - Thêm cột `slug` VARCHAR(120) cho bảng `quizzes`
  - Backfill: slugify title + hậu tố id ngắn
  - Index `idx_quizzes_slug`
- **SlugUtils.java:**
  - Map thủ công dấu tiếng Việt (NFD không xử lý đúng hết)
  - `isUuid()`, `isValidSlug()`, `slugify()`
- **V16__fix_last_rating_type.sql:**
  - Sửa `user_card_review.last_rating` từ VARCHAR → SMALLINT
  - Handle legacy 'GOOD' → '3'
- **Quiz Anti-Cheat Plan (`docs/quiz-anti-cheat-plan.md`):**
  - Rate limiting & cooldown (5 attempts/quiz/day, 10 min cooldown)
  - Bot detection (answer timing analysis)
  - Browser/tab focus tracking
  - IP-based rate limiting
  - Question delivery isolation
  - Admin moderation & flagged attempts dashboard

**Chưa xong / blocker**

-

**Next**

- Sprint 5: Progress heatmap + streak scheduler + Leaderboard Redis
- Quiz Anti-Cheat: Phase 1 implementation

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Quiz CRUD + Admin | `feature/quiz-crud` |
| Quiz Anti-Cheat | `feature/quiz-anti-cheat` |
| Progress/Leaderboard | `feature/progress-leaderboard` |

---

### Session 2026-07-01 — QuizDetail UI + API

**Đã làm**

- **QuizDetailPage layout:**
  - Grid 2 cột cho question cards (responsive)
  - Action buttons chuyển lên trên header
  - Card click → mở modal chỉnh sửa
- **UpdateQuestionRequest.java:**
  - Thêm `UpdateQuestionRequest.java` trong `dto/request/`
  - Fields: `questionText`, `options`, `correctOption`, `explanation`, `imageUrl`
- **QuizDetailPage API:**
  - `PUT /quizzes/{quizId}/questions/{questionId}` — update câu hỏi
  - `QuestionEditor.tsx` — modal form với validation
- **Dashboard active sessions:**
  - Flashcard session banner (localStorage persistence)
  - Quiz session banner (API call)
- **IDE diagnostics:**
  - Chạy `mvn clean compile` — thành công
  - Lỗi "cannot be resolved" trong IDE là classpath chưa sync

**Chưa xong / blocker**

- IDE classpath refresh (cần reload window)

**Next**

- Progress heatmap + streak scheduler + Leaderboard Redis

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Quiz edit UI | `feature/quiz-edit` |
| Progress/Leaderboard | `feature/progress-leaderboard` |

---

### Session 2026-06-30 — UX fixes

**Đã làm**

- **ResumeDialog fix:**
  - Thêm nút "Đóng, quay lại trang trước" để dismiss dialog mà không reset state
  - X button và text link đều gọi `onClose` handler
  - State phase/mode được giữ nguyên khi đóng dialog
- **Exit confirmation dialog:**
  - Tạo `ExitConfirmDialog.tsx` với 2 nút: "Ở lại" và "Thoát"
  - Hiện khi user click X button trên header trong Quiz session
  - Lưu tiến trình trước khi thoát về deck
  - Thêm X button vào `StudyHeader.tsx` với `onExit` prop
- **FlashCard fallback:**
  - Khi due cards ít hơn requested, fetch all deck cards làm fallback
  - Convert deck cards sang DueCard format với isNew=true
  - Debug logging để kiểm tra số cards

**Chưa xong / blocker**

-

**Next**

- Test tất cả các thay đổi
- Sprint 5: Progress heatmap + streak scheduler + leaderboard

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Study session + UX fixes | `feature/study-session` |
| Progress/Leaderboard | `feature/progress-leaderboard` |

---

### Session 2026-06-29 — StudyPage refactor + session persistence + mode switch fix

**Đã làm**

- **Session persistence (`frontend/src/utils/studySession.ts`):**
  - `StudySession` interface: `deckRef`, `mode`, `config`, `progress` (flashcard/quiz), `sessionCardIds`, `savedAt`
  - `createSession()` — khởi tạo từ card list
  - `createQuizSession()` — cho quiz (chỉ lưu attemptId, không card IDs)
  - `saveSession()` / `loadSession()` / `clearSession()` — localStorage với TTL per-mode
  - `resolveSessionCards()` — rehydrate session với fresh cards từ API
  - `mergeRating()` — merge stats vào session
  - `relativeTime()` — format thời gian "2 giờ trước"
  - TTL options: 5m, 15m, 30m, 1h, 3h, 6h, 1d, 3d, Never
  - Config persistence: `loadConfig()` / `saveConfig()` per mode
- **Resume dialog:**
  - `ResumeDialog.tsx` — dialog "Tiếp tục phiên học?" với icon mode, thời gian, số thẻ
  - Nút "Bắt đầu mới" (discard) và "Tiếp tục" (resume)
  - Cả `ReviewPage` và `StudyPage` đều có resume dialog
  - Auto-clear session khi không còn cards để resume
- **StudyPage component extraction:**
  - Tách 9 components từ StudyPage.tsx (975 dòng → 365 dòng):
    - `ModeDropdown.tsx` — dropdown chọn mode
    - `ModeSettings.tsx` — panel cài đặt (shuffle, starred, direction, count, TTL)
    - `StudyHeader.tsx` — header với progress bar, index, mode dropdown
    - `StudyConfigView.tsx` — màn hình cấu hình
    - `ResumeDialog.tsx` — dialog tiếp tục session
    - `StudyEmptyState.tsx` — khi không có thẻ
    - `FlashcardResult.tsx` — kết quả flashcard
    - `QuizResult.tsx` — kết quả quiz/learn/spell
  - StudyPage.tsx giữ lại: state, mutations, handlers, keyboard shortcuts, mount effect
- **Bug fix:**
  - Chuyển FLASHCARD → QUIZ: trước đây không hiện gì (chỉ reset state); giờ auto-start session mới qua `startMutation`
  - `startMutation` truyền explicit `mode` qua mutation variables thay vì closure (tránh stale mode)
- **Quiz UX improvements:**
  - Auto-advance ON by default (bỏ toggle)
  - Auto-submit on timeout, disable answers after expired
  - Wrong answers improved với Levenshtein distance (loại bỏ đáp án quá giống)
  - Wrong answers improved với Levenshtein distance (loại bỏ đáp án quá giống)
- **FlashCard improvements:**
  - TTL toggle ON/OFF (default 60 phút)
  - Bỏ starredOnly option (theo yêu cầu user)
  - Debug logging để kiểm tra số cards
- **QuestionGenerator improvements:**
  - Thêm Levenshtein distance check
  - Wrong answers từ cards khác trong deck
  - Wrong answers từ cards khác trong deck

**Chưa xong / blocker**

-

**Next**

- Sprint 5: Progress heatmap + streak scheduler + leaderboard

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Study session + components | `feature/study-session` |
| Progress/Leaderboard | `feature/progress-leaderboard` |

---

### Session 2026-06-24 — Study Modes: Flashcard/Quiz

**Đã làm**

- **Backend (`com.backend.lumotus.study/`, `service/StudyService.java`, `controller/StudyController.java`):**
  - `StudyMode` enum: FLASHCARD, QUIZ
  - `StudyAttempt` in-memory model (ConcurrentHashMap) — lưu questions + answers trong session
  - `QuestionGenerator` — sinh questions dynamic từ card data theo mode:
    - FLASHCARD: front→câu hỏi, back→đáp án
    - QUIZ: front→câu hỏi, back→đáp án đúng, 3 đáp án sai từ cards khác trong deck
  - `StudyService`: POST `/study/{deckRef}/start` (sinh questions), POST `/study/{attemptId}/submit` (tính score+XP), GET `/study/{attemptId}/result`
  - DTOs: `StartStudyRequest/Response`, `SubmitStudyRequest`, `QuestionResponse`, `StudyResultResponse`, `AnswerDetail`
  - XP: QUIZ×8; update `users.xp` + `daily_activity`
- **Frontend:**
  - `StudyPage.tsx` — unified page: config (chọn mode + số câu) → session → result
  - `ModeTab.tsx` — 2 tab ngang với icon: Layers/Flashcard, FileText/Quiz
  - `QuizView.tsx` — MCQ 2-col grid, correct=green/wrong=red highlight
  - `FlashCard` — flip card với rating AGAIN/HARD/GOOD/EASY
  - `StudyPage` result: SVG score ring, XP badge, stats breakdown
  - Route: `/decks/:deckRef/study`
  - DeckDetailPage: nút "Học" → `/study`, Dashboard JumpBackCard → `/study`
  - `study.ts` API client, `types/study.ts`
- **Docs:**
  - `spec.md` §4 Nhóm 6: Study API + modes; §5.4: Study logic
  - `flashcard-project-plan.md` §9: Study Modes checklist
  - `development-plan.md`: Sprint 5 table với status ✅/⏳
- Build: `npm run build` ✅, `mvn compile` ✅

**Chưa xong / blocker**

- Code chưa commit
- Streak scheduler backend
- Progress heatmap + leaderboard

**Next**

- Commit Study Modes
- Sprint 5: streak scheduler, heatmap, leaderboard Redis, Progress/Leaderboard FE

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Study Modes BE + FE | `feature/quiz-progress` |

---

**Đã làm**

- **Dark theme toàn hệ thống:**
  - `MainLayout.tsx` — background ảnh hero mờ 6%, gradient overlay `#1A1520`, radial glow pink
  - `LibraryPage.tsx` — full-width (`-mx-4`), grid 4 cột, dark surface `rgba(37,32,48,0.7)`
  - `ExplorePage.tsx` — search bar, cards, empty state dark; grid 4 cột
  - `DeckDetailPage.tsx` — header, card list panel, pagination dark
  - `ReviewPage.tsx` — background gradient, footer glass
  - `DeckCard.tsx` — dark glass card với border `#3D3348`
  - `CardGridItem.tsx` — dark card với hover pink accent
  - `ReviewFlashcard.tsx` — card face dark với shadow glow pink/green
  - `index.css` — `.review-card-inner` dark glass, `.review-card-inner--back` dark green tint
  - `DeckGridSkeleton.tsx` — dark placeholder
- **LandingPage.tsx:**
  - Section 2 (About): nền `#1A1520`, gradient pink nhạt, text `#F5F0FA`/`#C4B8D9`, hiệu ứng giữ nguyên
  - Section 3 (Features): nền `#1A1520`, cards dark glass, StatCard dark, hiệu ứng giữ nguyên
  - Header nav: links scroll thật (`#about-section`, `#features-section`, `#cta-section`)
  - Page wrapper: nền `#1A1520`
- Build: `npm run build` ✅

**Chưa xong / blocker**

- Code chưa commit

**Next**

- Commit Sprint 4b UI changes
- Sprint 5: Quiz session + `attemptRef` slug
- Sprint 5: Heatmap, streak, stats, leaderboard Redis

**Nhánh gợi ý**

|| Phạm vi | Nhánh |
|---|---|
| Dark theme UI | `style/english-learning-ui` |
| Docs sync only | `docs/ui-refactor-plan` |

---

### Session 2026-06-18 — Đồng bộ trạng thái thực tế + lập kế hoạch refactor UI

**Đã làm**

- Đối chiếu code hiện có với yêu cầu đề tài
- Xác nhận chưa làm Quiz/Leaderboard/Admin; chỉ củng cố hệ thống
- Ghi nhận điểm chưa ưng ý: trải nghiệm giao diện học tiếng Anh chưa đủ mượt
- Cập nhật docs phác thảo đợt refactor UI tách biệt khỏi Quiz/Leaderboard/Admin

**Chưa xong / blocker**

- Chưa bắt đầu refactor code; chưa mở Figma wireframe mới

**Next**

- Refactor UI tập trung: Home, Library, Explore, Deck Detail, Review
- Cập nhật Figma wireframe cho các màn đã có
- Giữ nguyên phạm vi: không mở Quiz/Leaderboard/Admin trong đợt này

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Refactor UI + đồng bộ Figma | `style/english-learning-ui` |
| Chỉ cập nhật docs | `docs/ui-refactor-plan` |

---

### Session 2026-06-07 — Review UX polish + audio + starred filter

**Đã làm**

- Fix lật thẻ 3D: `key` theo `cardId`, tắt transition khi đổi thẻ, z-index/backface CSS — không còn flash mặt sau thẻ kế
- BE pha **4a**: `MediaFolder.AUDIO`, upload MP3/WAV/OGG/WebM qua Cloudinary (`resource_type: video`)
- FE pha **4b**: `CardAudioButton` trên flashcard Review (preload khi lật, nút 🔊 3D); `AudioUploadField` trong `CardFormDialog`
- BE+FE: `GET /review/due?starredOnly=true` — chỉ thẻ đã gắn sao; pill **Chỉ sao** trên ReviewPage
- Dashboard **Quay lại học ngay**: hiển thị `{n} đến hạn`, nút **Ôn n thẻ** → `/decks/:slug/review`

**Chưa xong / blocker**

- Streak cron scheduler
- Code chưa commit

**Next**

- Commit/PR `feature/review-srs`
- Sprint 5: Quiz session

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp SRS + audio + UX | `feature/review-srs` |

---

### Session 2026-06-07 — Sprint 4 SRS Review (MVP)

**Đã làm**

- BE: `Sm2Algorithm`, `ReviewRating`, entities + repos review/progress/daily_activity
- BE: `ReviewService` — due cards (mới + đến hạn), rate SM-2, toggle star; cập nhật XP, `daily_activity`, `user_deck_progress`
- BE: `ReviewController` — `GET /api/v1/review/due?deckRef=`, `POST .../rate`, `POST .../star`
- BE: `Sm2AlgorithmTest` (3 test cases)
- FE: `ReviewPage` + `MinimalLayout` — lật thẻ, Again/Hard/Good/Easy, đánh dấu sao, toast XP
- FE: nút «Ôn tập» trên `DeckDetailPage` (owner)
- UI (session trước, đã merge): sidebar icon/chữ toggle, logo sen, Quizlet layout

**Chưa xong / blocker**

- Restart backend sau pull để chạy migration V5 (nếu chưa)
- Audio upload/phát trong Review (pha 4a–4b)
- Streak cron, filter ôn chỉ thẻ starred
- Code SRS chưa commit

**Next**

- Commit/PR `feature/review-srs`
- Pha 4b: phát `audio_url` trên flashcard Review
- Dashboard: hiển thị số thẻ đến hạn từ API

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp SRS MVP | `feature/review-srs` |
| Chỉ audio | `feature/media-audio-upload` |

---

### Session 2026-06-07 — Trang chủ Quizlet, thư viện & nguồn gốc deck

**Đã làm**

- BE: `V5__decks_source_deck.sql` — `decks.source_deck_id`; `copyDeck` gán nguồn; metadata trên `DeckSummaryResponse`
- BE: phân trang + search thẻ (`GET /decks/{deckRef}/cards?q=`)
- FE: tách `/home` (Dashboard Quizlet-style) vs `/library` (quản lý deck); nav Trang chủ / Thư viện / Khám phá
- FE: strip «Gần đây» + «Gợi ý tham khảo»; hero «Tiếp tục học»; `DeckCard` badge «Copy từ …»; banner nguồn trên `DeckDetailPage`
- Docs: `development-plan.md` — Sprint 2c, roadmap âm thanh từ vựng (pha 4a–6)

**Chưa xong / blocker**

- Restart backend để Flyway chạy V5 (copy cũ trước migration không có lineage)
- SRS / Quiz / nghe từ — Sprint 4–5
- Activity «Gần đây» vẫn theo `updatedAt` deck, chưa theo lịch sử học thật

**Next**

- Sprint 4: SM-2 + Review UI + nút phát `audio_url` (pha 4a–4b)
- Commit/PR gộp session trên `develop`

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp home + lineage | `feature/deck-home-library` |
| Chỉ SRS | `feature/review-srs` |
| Chỉ audio upload | `feature/media-audio-upload` |

---

### Session 2026-06-07 — Deck UX, Khám phá & Import upsert

**Đã làm**

- BE: `findPublicDecks` — Khám phá chỉ deck `isPublic`; `ownerUsername` trên `DeckSummaryResponse`
- BE: Import CSV upsert theo `front` (dedupe trong file + cập nhật thẻ cũ); response `addedCount` / `updatedCount`
- FE: `EditDeckDialog` (Cài đặt deck — title, mô tả, công khai, topic)
- FE: `DeckCard` variant `library` vs `explore` (badge riêng tư / tên người tạo)
- FE: `CardGridItem` + skeleton — lưới 5 cột, thẻ nhỏ gọn
- FE: `ImportCsvDialog` — ghi chú trùng `front`; toast thêm mới / cập nhật

**Chưa xong / blocker**

- `CLOUDINARY_*` thật trong `.env` mới upload ảnh được
- Nguồn gốc deck copy (`source_deck_id`) — chưa có schema
- Code session chưa commit trên `develop`

**Next**

- Commit/PR gộp Sprint 3 + deck UX
- Sprint 4: SRS SM-2 + Review UI

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp | `feature/async-import-media` |
| Chỉ SRS | `feature/review-srs` |

---

### Session 2026-06-08 — Sprint 3 Import & Media

**Đã làm**

- BE: Cloudinary (`MediaService`, `POST /media/upload`), CSV import (`POST /decks/import`)
- `CsvDeckImporter` — OpenCSV, header `front,back,...`, skip invalid rows
- FE: `ImageUploadField`, `ImportCsvDialog`, `ProfilePage` (`/settings`)
- Card form upload ảnh; Home + DeckDetail import CSV

**Chưa xong / blocker**

- Cần `CLOUDINARY_*` trong `.env` để upload ảnh (dev không có → toast lỗi rõ)

**Next**

- Sprint 4: SRS SM-2 + Review UI

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp | `feature/async-import-media` |
| Chỉ SRS | `feature/review-srs` |

---

### Session 2026-06-08 — Sprint 2 FE (Explore, Dashboard, DeckDetail)

**Đã làm**

- FE types + API: `types/deck.ts`, `api/decks.ts`, `api/topics.ts`
- `ExplorePage` — lọc topic, tìm kiếm, grid deck công khai
- `HomePage` — dashboard deck của tôi + tạo deck
- `DeckDetailPage` — `/decks/:deckRef` (slug); xem/copy deck; owner CRUD thẻ
- Components: `DeckCard`, `TopicFilter`, `CreateDeckDialog`, `CardFormDialog`
- `npm run build` pass

**Chưa xong / blocker**

- Sửa deck metadata (title/public) trên UI — chỉ CRUD thẻ hiện tại
- Ảnh card/avatar cần Sprint 3 Media

**Next**

- Sprint 3: `POST /media/upload` + CSV import
- FTS `search_vector` (backend, tùy chọn)

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp | `feature/deck-card-crud` |
| Import + media | `feature/async-import-media` |

---

### Session 2026-06-08 — Đồng bộ docs + profile API

**Đã làm**

- `PUT /api/v1/auth/me`, `PUT /api/v1/auth/me/password` — profile & đổi mật khẩu
- Đồng bộ lộ trình: `development-plan.md` căn theo `flashcard-project-plan.md` §9 (Import + Media **Sprint 3**, trước SRS)
- Cập nhật checkbox §9, cột TT API §4, env Google/ADMIN/JWT script
- `docs/README.md` — quy tắc phân cấp tài liệu

**Chưa xong / blocker**

- FE profile settings; avatar URL thực cần Sprint 3 Media

**Next**

- Sprint 2 FE (Explore/Dashboard/DeckDetail + slug routes)
- Sprint 3: CSV import + Cloudinary

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| FE deck pages | `style/deck-explore-pages` |
| Import + media | `feature/async-import-media` |

---

### Session 2026-06-08 — Sprint 2b Slug URLs (backend only)

**Đã làm**

- `V3__decks_slug.sql`: cột `slug`, backfill, unique `(owner_id, slug)`
- `SlugUtils` — slugify title, nhận diện UUID
- Deck API: path `{deckRef}` (UUID hoặc slug); response có `slug`
- Topic API: `GET/PUT/DELETE /topics/{slug}`; list decks `?topicSlug=`
- Cập nhật `spec.md`, `flashcard-project-plan.md`, Postman (`deckSlug`, `topicSlug`)

**Chưa xong / blocker**

- Quiz slug — chờ Sprint 5 (đã ghi trong spec)
- FE Explore / DeckDetail chưa làm (cố ý bỏ qua session này)

**Next**

- FE: `ExplorePage`, `DashboardPage`, `DeckDetailPage` dùng slug trong URL
- FTS `search_vector` cho `q` (Sprint 2 còn lại)

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp tiếp Sprint 2 | `feature/deck-card-crud` |
| Chỉ FE | `style/deck-explore-pages` |

---

### Session 2026-06-08 — Fix deck update + ADMIN bootstrap + kế hoạch slug

**Đã làm**

- Fix `topicIds` null (Postman `{{topicId}}` rỗng) — normalize, bỏ null thay vì 400
- Fix `deleteAllByDeckId` @Query (tránh 500 update deck)
- `AdminBootstrapRunner` + `ADMIN_BOOTSTRAP_EMAIL` trong `.env`
- `AccessDeniedException` → 403 message rõ (cần ADMIN)
- Cập nhật `development-plan.md` Sprint 2b — slug cho deck, quiz, entity sau
- Postman collection: hướng dẫn ADMIN + bỏ topicIds mặc định khi update

**Chưa xong / blocker**

- User phải **Login lại** sau khi được promote ADMIN (role nằm trong JWT)
- Chưa migration `decks.slug`

**Next (session tiếp)**

- Sprint 2b: slug deck + quiz (docs → migration → API hybrid)
- Topic path `/topics/{slug}`; filter `?topicSlug=`
- FE Explore / DeckDetail

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Slug deck + quiz | `feature/deck-quiz-slug` |
| Chỉ deck slug | `feature/deck-slug-api` |

---

### Session 2026-06-08 — JWT script + Sprint 2 Deck API (backend)

**Đã làm**

- `scripts/ensure-jwt-secret.mjs` — tự sinh `JWT_SECRET` nếu `.env` còn placeholder; hook Maven `initialize` trước `spring-boot:run`
- `frontend/vite.config.ts`: `envDir` → đọc `.env` monorepo (Google OAuth FE)
- BE Sprint 2: `Topic`, `Deck`, `Card`, `DeckTopic` entities + repos
- BE: `TopicController` (GET public, ADMIN CRUD), `DeckController` (list/create/detail/update/delete/copy/cards)
- `ForbiddenException`, `@SQLRestriction` soft-delete trên `SoftDeleteEntity`

**Chưa xong / blocker**

- Chưa có FE Explore / DeckDetail
- Chưa seed topics mẫu (migration hoặc admin tạo tay)

**Next**

- FE: `ExplorePage`, `DashboardPage`, `DeckDetailPage` + API client
- FTS `q` qua `search_vector` (native query) nếu cần

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp (đang dùng) | `feature/deck-card-crud` |
| Chỉ frontend | `style/deck-explore-pages` |

---

### Session 2026-06-08 — Sprint 1 Auth + Google OAuth

**Đã làm**

- BE: `JwtService`, `RefreshTokenService` (Redis), `AuthService`, `AuthController`
- BE: Google OAuth — `V2__users_oauth`, `GoogleTokenVerifier`, `POST /auth/google`
- BE: `JwtAuthenticationFilter`, `SecurityConfig` RBAC, CORS, BCrypt
- FE: `LoginPage`, `RegisterPage`, `AuthLayout`, `authStore`, axios interceptor
- FE: `PrivateRoute`, bootstrap silent refresh, `UserMenu`, sidebar collapse
- FE: `GoogleLoginButton` trên Login/Register; fix refresh cookie

**Chưa xong / blocker**

- Cần `GOOGLE_CLIENT_ID` + `VITE_GOOGLE_CLIENT_ID` trong `.env` (Google Cloud Console)
- Chưa có MockMvc test auth

**Next**

- Merge `feature/auth-login` (gồm Google OAuth)
- Sprint 2: Deck & Card CRUD

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp (khuyến nghị) | `feature/auth-login` |
| Tách backend | `feature/auth-jwt` |
| Tách frontend | `style/auth-pages` |

---

### Session 2026-06-08 — Sprint 0 hoàn tất & infra

**Đã làm**

- Sửa Flyway Spring Boot 4: `spring-boot-starter-flyway`
- `application.yaml`: import `.env` monorepo, bỏ fallback mật khẩu mặc định
- pgAdmin: đổi email mặc định `admin@lumotus.dev` (tránh domain `.local` bị reject)
- Reset Docker volume, đồng bộ mật khẩu PostgreSQL với `.env`

**Chưa xong / blocker**

- —

**Next**

- Sprint 1 Auth *(đã làm session trên)*

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp (khuyến nghị) | `feature/init-database-and-layout` |
| Tách DB | `feature/db-init-schema` |
| Tách core | `feature/core-base-entities` |
| Tách FE shell | `style/app-layout-shell` |
| Tách infra | `chore/infra-dev-environment` |

---

### Session 2026-06-07 — Sprint 0 implementation

**Đã làm**

- `V1__init.sql`: 13 bảng, indexes §2.3, FTS `search_vector`, trigger `total_cards`
- JPA: `BaseEntity`, `SoftDeleteEntity`, `User`, `JpaConfig`
- Core: `SecurityConfig` (permit all tạm), `GlobalExceptionHandler`, `ApiError`
- FE: light theme `index.css`, `axiosClient`, `MainLayout`, routes placeholder

**Chưa xong / blocker**

- —

**Next**

- Sprint 0 infra & verify *(đã làm session 2026-06-08)*

**Nhánh gợi ý**

| Phạm vi | Nhánh |
|---|---|
| Gộp với session 2026-06-08 | `feature/init-database-and-layout` |

---

### Session 2026-06-07 — Docs & thiết kế

**Đã làm**

- Tạo `spec.md`, `flashcard-project-plan.md` (schema, API, roadmap 6 giai đoạn)
- Đánh giá perf CSDL; bổ sung `deck_id` trên `user_card_review`, index, FTS `search_vector`
- Tạo `ui-design-plan.md` (light theme, Plus Jakarta / Literata / Be Vietnam Pro, 16:9 desktop)
- Tạo `figma-wireframe-spec.md`; vẽ Figma một phần (Login, Register, Dashboard, Explore desktop)
- Reorganize: move tài liệu vào `docs/`; tạo `docs/README.md`, `progress.md`, `development-plan.md`
- Cập nhật font trong `frontend/index.html`, `index.css`

**Chưa xong / blocker**

- Figma: rate limit Starter — còn Deck Detail, Review, Quiz, mobile, Admin…

**Next**

- Sprint 0 implementation *(đã xong)*

**Nhánh gợi ý**

| Phạm vi | File liên quan | Nhánh |
|---|---|---|
| Gộp spec + roadmap | `spec.md`, `flashcard-project-plan.md`, `development-plan.md` | `docs/spec-and-project-plan` |
| UI design | `ui-design-plan.md` | `docs/ui-design-plan` |
| Figma wireframe | `figma-wireframe-spec.md` | `docs/figma-wireframe-spec` |

---

### Session YYYY-MM-DD — [Tiêu đề ngắn]

**Đã làm**

- …

**Chưa xong / blocker**

- …

**Next**

- …

**Nhánh gợi ý**

| Phạm vi | File / module | Nhánh |
|---|---|---|
| Gộp | … | `feature/...` |
| Tách (nếu cần) | … | `feature/...` |

---

## Mẫu copy-paste (buổi mới)

```markdown
### Session YYYY-MM-DD — [Tiêu đề]

**Đã làm**
-

**Chưa xong / blocker**
-

**Next**
-

**Nhánh gợi ý**

| Phạm vi | File / module | Nhánh |
|---|---|---|
| Gộp | … | `feature/...` |
| Tách (nếu cần) | … | `feature/...` |
```
