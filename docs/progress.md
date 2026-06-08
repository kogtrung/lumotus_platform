# Tiến độ dự án — Lumotus

File theo dõi **session làm việc**: đã xong gì, đang ở đâu, làm tiếp gì.  
Cập nhật **cuối mỗi buổi** (hoặc khi merge PR quan trọng).

> Chỉ ghi **công việc chính** (code, schema, docs, thiết kế). Không ghi thao tác chạy app (`docker compose`, `mvn`, `npm run dev`…).  
> Khi session xong: thêm **Nhánh gợi ý** ngay bên dưới.

**Sprint chi tiết:** [`development-plan.md`](development-plan.md) · **Roadmap dài:** [`flashcard-project-plan.md`](flashcard-project-plan.md) §9

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
| **Giai đoạn** | Sprint 1 — Auth (implementation xong, chờ merge PR) |
| **Branch** | `feature/auth-login` |
| **Sprint đang focus** | Sprint 2 — Deck & Card |
| **Việc tiếp theo** | Topic / Deck / Card CRUD + Explore FE |
| **Cập nhật lần cuối** | 2026-06-08 |

### Tóm tắt nhanh

- **Docs / thiết kế:** spec, plan, UI design, Figma spec, reorganize `docs/`
- **Figma wireframe:** một phần (Login, Register, Dashboard, Explore desktop)
- **Backend:** Auth JWT + Redis refresh, `AuthController`, RBAC skeleton
- **Frontend:** Login/Register, `AuthLayout`, silent refresh, `PrivateRoute`
- **Infra:** pgAdmin, `.env` sync (Sprint 0)

### Nhánh gợi ý (Sprint 2 — chưa bắt đầu)

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
- [x] Login / Register FE + silent refresh + `PrivateRoute`
- [x] Fix refresh cookie (path `/`, Vite proxy) + sessionStorage accessToken

### Sprint 1b — Google OAuth

- [x] Migration `V2__users_oauth.sql`
- [x] `POST /api/v1/auth/google` + verify Google ID token
- [x] FE: nút Google trên Login/Register (`@react-oauth/google`)

### Sprint 2 — Deck & Card

- [ ] Deck / Card / Topic CRUD + copy deck
- [ ] Explore, Dashboard, DeckDetail FE

### Sprint 3 — SRS Review

- [ ] SM-2 + `ReviewService` + Review UI

### Sprint 4 — Quiz & Progress

- [ ] Quiz session + heatmap + leaderboard

### Sprint 5 — Async & Media

- [ ] CSV import + AI generate + Cloudinary

### Sprint 6 — Admin & Polish

- [ ] Admin UI + MockMvc tests + responsive

---

## Nhật ký session

Ghi **mới nhất lên trên**. Mỗi entry: ngày, đã làm, chưa xong, **Next**, **Nhánh gợi ý** (nếu session đã xong phần code).

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
