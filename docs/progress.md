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
| **Giai đoạn** | Sprint 4b gần xong — Đang chuyển sang Sprint 5 Quiz & Progress |
| **Branch** | `develop` |
| **Sprint đang focus** | UI Dark Theme Sprint (LandingPage, MainLayout, Explore, Library, Review) |
| **Việc tiếp theo** | Commit Sprint 4b UI changes → Sprint 5 Quiz session |
| **Đối chiếu đề tài** | [`spec.md`](spec.md) §8 |
| **Cập nhật lần cuối** | 2026-06-22 |

### Tóm tắt nhanh

- **Đã ổn định:** Auth, Deck/Card, Import CSV, Media upload, SRS Review + audio, Landing Page UI
- **Đang tập trung:** Dark theme + full-width layout (LandingPage, MainLayout, Explore, Library, Review, DeckDetail)
- **Chưa triển khai:** Quiz, Progress/Heatmap/Streak, Leaderboard Redis, Admin — Sprint 5–6

### Nhánh gợi ý (đợt này)

| Phạm vi | Nhánh |
|---|---|
| Refactor UI + đồng bộ Figma | `style/english-learning-ui` |
| Chỉ cập nhật docs | `docs/ui-refactor-plan` |

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

### Sprint 5 — Quiz & Progress ⏳

- [ ] Quiz session + `attemptRef` slug
- [ ] Heatmap, streak, stats, leaderboard Redis

### Sprint 6 — AI, Admin & Polish ⏳

- [ ] AI generate + `async_jobs` polling
- [ ] Admin UI + MockMvc tests + responsive

---

## Nhật ký session

Ghi **mới nhất lên trên**. Mỗi entry: ngày, đã làm, chưa xong, **Next**, **Nhánh gợi ý** (nếu session đã xong phần code).

---

### Session 2026-06-22 — Dark Theme UI + Sprint 4b Hoàn thiện

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
