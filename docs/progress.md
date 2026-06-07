# Tiến độ dự án — Lumotus

File theo dõi **session làm việc**: đã xong gì, đang ở đâu, làm tiếp gì.  
Cập nhật **cuối mỗi buổi** (hoặc khi merge PR quan trọng).

**Sprint chi tiết:** [`development-plan.md`](development-plan.md) · **Roadmap dài:** [`flashcard-project-plan.md`](flashcard-project-plan.md) §9

---

## Trạng thái hiện tại

| Mục | Giá trị |
|---|---|
| **Giai đoạn** | Chuẩn bị code — Sprint 0 (chưa bắt đầu implementation) |
| **Branch** | `develop` |
| **Sprint đang focus** | Sprint 0 — DB migration + shell FE |
| **Việc tiếp theo** | `feature/db-v1-init-schema`: viết `V1__init.sql` + `BaseEntity` + verify Flyway |
| **Cập nhật lần cuối** | 2026-06-07 |

### Tóm tắt nhanh

- **Docs / thiết kế:** gần xong (spec, plan, UI, Figma spec, reorganize `docs/`)
- **Figma wireframe:** một phần (Login, Register, Dashboard, Explore desktop)
- **Backend code:** scaffold only — chưa có entity, migration, API
- **Frontend code:** scaffold only — chưa có pages, API client

---

## Checklist theo sprint

### Sprint 0 — Nền tảng

- [ ] `V1__init.sql` (13 bảng, index, `search_vector`, trigger `total_cards`)
- [ ] `BaseEntity`, `SoftDeleteEntity`, `JpaConfig`, `GlobalExceptionHandler`
- [ ] Backend start + Flyway OK với Docker
- [ ] FE: light tokens `index.css`, `axiosClient`, `MainLayout` shell

### Sprint 1 — Auth

- [ ] JWT + Redis refresh + Auth API
- [ ] Login / Register FE + silent refresh

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

Ghi **mới nhất lên trên**. Mỗi entry: ngày, người (tuỳ chọn), đã làm, chưa xong, **Next**.

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
- Chưa có `V1__init.sql` — backend chưa chạy được với DB thật

**Next (buổi sau)**

1. Branch `feature/db-v1-init-schema`
2. Viết `V1__init.sql` theo `docs/spec.md` §2
3. `BaseEntity` + `User` entity; chạy `./mvnw spring-boot:run`
4. (Song song) FE light theme + `MainLayout`

---

### Session YYYY-MM-DD — [Tiêu đề ngắn]

**Đã làm**

- …

**Chưa xong / blocker**

- …

**Next**

- …

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
```
