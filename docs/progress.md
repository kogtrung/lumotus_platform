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
| **Giai đoạn** | Sprint 2 — Deck FE (Explore/Dashboard/DeckDetail xong) |
| **Branch** | `feature/deck-card-crud` |
| **Sprint đang focus** | Sprint 3 Import + Media |
| **Việc tiếp theo** | CSV import + Cloudinary upload; FTS `search_vector` (tùy chọn) |
| **Cập nhật lần cuối** | 2026-06-08 |

### Tóm tắt nhanh

- **Docs:** `spec.md`, `flashcard-project-plan.md` (roadmap §9), `development-plan.md` (sprint), đồng bộ Import/Media trước SRS
- **Backend:** Auth + Google + profile PUT; Deck/Card/Topic CRUD; slug `V3`; ADMIN bootstrap
- **Frontend:** Login/Register/Google; Explore, Dashboard (Home), DeckDetail + slug routes
- **Infra:** JWT auto-gen script, Postman collection, monorepo `.env` cho Vite

### Nhánh gợi ý (Sprint 2 FE)

| Phạm vi | Nhánh |
|---|---|
| Gộp | `feature/deck-card-crud` |
| Chỉ backend | `feature/deck-crud-api` |
| Chỉ frontend | `style/deck-explore-pages` |

---

## Checklist theo sprint

### Sprint 0 — Nền tảng

- [x] `V1__init.sql` (13 bảng, index, `search_vector`, trigger `total_cards`)
- [x] `BaseEntity`, `SoftDeleteEntity`, `JpaConfig`, `GlobalExceptionHandler`
- [x] Flyway tích hợp Spring Boot 4 (`spring-boot-starter-flyway`)
- [x] Backend đọc biến môi trường từ `.env` gốc monorepo
- [x] FE: light tokens `index.css`, `axiosClient`, `MainLayout` shell

### Sprint 1 — Auth

- [x] JWT + Redis refresh + Auth API (`register`, `login`, `refresh`, `logout`, `me`)
- [x] `PUT /me` (username, avatarUrl), `PUT /me/password`
- [x] Login / Register FE + silent refresh + `PrivateRoute`
- [x] Fix refresh cookie (path `/`, Vite proxy) + sessionStorage accessToken

### Sprint 1b — Google OAuth

- [x] Migration `V2__users_oauth.sql`
- [x] `POST /api/v1/auth/google` + verify Google ID token
- [x] FE: nút Google trên Login/Register (`@react-oauth/google`)

### Sprint 2 — Deck & Card

- [x] BE: entities Topic / Deck / Card / DeckTopic + repositories
- [x] BE: Topic CRUD (ADMIN), Deck & Card CRUD + copy deck
- [x] Fix update deck `topicIds` + `deleteAllByDeckId` query
- [x] `ADMIN_BOOTSTRAP_EMAIL` — promote user thành ADMIN (dev)
- [ ] FTS search (`q`) nâng cao qua `search_vector`
- [x] Explore, Dashboard (Home), DeckDetail FE
- [x] API client deck/card/topic + React Query

### Sprint 2b — Slug URLs

- [x] Docs: `spec.md` + plan — `decks.slug`; quiz slug ghi chú Sprint 4
- [x] Migration `V3__decks_slug.sql` + index `idx_decks_owner_slug`
- [x] `SlugUtils`, deck path `{deckRef}` hybrid UUID/slug
- [x] Topic `GET/PUT/DELETE /topics/{slug}`; filter `?topicSlug=`
- [ ] Quiz `attemptRef` slug — Sprint 5
- [x] FE routes dùng slug (`/decks/:deckRef`)

### Sprint 3 — Import & Media *(trước SRS — theo flashcard §9)*

- [ ] `POST /media/upload` (Cloudinary)
- [ ] `POST /decks/import` CSV
- [ ] FE: upload avatar, ảnh card

### Sprint 4 — SRS Review

- [ ] SM-2 + `ReviewService` + Review UI + starred

### Sprint 5 — Quiz & Progress

- [ ] Quiz session + `attemptRef` slug
- [ ] Heatmap, streak, stats, leaderboard Redis

### Sprint 6 — AI, Admin & Polish

- [ ] AI generate + `async_jobs` polling
- [ ] Admin UI + MockMvc tests + responsive

---

## Nhật ký session

Ghi **mới nhất lên trên**. Mỗi entry: ngày, đã làm, chưa xong, **Next**, **Nhánh gợi ý** (nếu session đã xong phần code).

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

- Quiz slug — chờ Sprint 4 (đã ghi trong spec)
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
| … | … | `feature/...` |

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
