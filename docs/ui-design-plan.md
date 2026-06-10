# Kế hoạch giao diện — Lumotus

Tài liệu thiết kế UI/UX cho ứng dụng học từ vựng Tiếng Anh **Lumotus** (SRS SM-2, Quiz, XP, AI Generate).

**Liên quan:** [`spec.md`](spec.md) (API & nghiệp vụ) · [`flashcard-project-plan.md`](flashcard-project-plan.md) (roadmap) · [`figma-wireframe-spec.md`](figma-wireframe-spec.md) (input vẽ wireframe Figma)

**Theme:** Light-first · Concept **"Clean Study"** (Quizlet-inspired) — nền sáng, chrome tối giản, thao tác nhanh.

**Tham chiếu UX:** Quizlet home — sidebar trái, header search + nút tạo, «Quay lại học ngay», «Gần đây», gợi ý ngang.

---

## 1. Design Principles

| Nguyên tắc | Mô tả |
|---|---|
| **Clean & scannable** | Ít shadow, viền mỏng; nội dung chính nổi bật hơn chrome |
| **Quizlet-familiar** | Sidebar + search header + pill button — quen với người dùng flashcard |
| **Focus-first** | Review/Quiz tối giản chrome; CTA rõ, không distraction |
| **Gamification nhẹ** | XP, streak hiển thị gọn — không chiếm hero |
| **Accessible** | Contrast ≥ 4.5:1 (WCAG AA); SRS buttons có icon + label + màu |
| **Mobile-first** | Bottom nav mobile; sidebar desktop từ `md` (768px) |

---

## 2. Color System

### 2.1 Surfaces & Brand

| Token | Hex | Dùng cho |
|---|---|---|
| `bg` | `#F6F7F9` | Nền vùng nội dung chính |
| `surface` | `#FFFFFF` | Sidebar, header, card, modal |
| `border-subtle` | `#E4E6EB` | Viền card, divider |
| `border-strong` | `#D0D4DC` | Viền input/outline button |
| `primary` | `#4255FF` | CTA, link active, logo mark (Quizlet blue) |
| `primary-hover` | `#3245EE` | Hover CTA |
| `primary-subtle` | `#EDEFFD` | Nav active, chip selected, icon tile |
| `secondary` | `#586380` | Text phụ, secondary button |
| `secondary-subtle` | `#F0F2F5` | Nền tile nhẹ |

### 2.2 Semantic

| Token | Hex | Dùng cho |
|---|---|---|
| `success` | `#3CBF8A` | Hoàn thành, đúng quiz |
| `warning` | `#F0B429` | Timer sắp hết, cảnh báo |
| `danger` | `#F07167` | Lỗi, xóa |
| `info` | `#5BC0EB` | Thông tin |

### 2.3 Text

| Token | Hex | Dùng cho |
|---|---|---|
| `text-primary` | `#282E3D` | Tiêu đề, nội dung chính |
| `text-secondary` | `#586380` | Mô tả phụ |
| `text-muted` | `#939BB4` | Caption, placeholder |
| `text-inverse` | `#FFFFFF` | Text trên nút primary |

### 2.4 Gamification

| Token | Hex | Dùng cho |
|---|---|---|
| `xp-gold` | `#F5C542` | Icon XP, badge điểm |
| `streak-flame` | `#FF9B5E` | Chuỗi ngày học |
| `star` | `#FFD166` | Thẻ đã đánh dấu sao |

### 2.5 SRS Rating Buttons

| Rating | Background | Text/Icon | Icon (Lucide) |
|---|---|---|---|
| AGAIN | `#FEE8E6` | `#D94F4F` | `RotateCcw` |
| HARD | `#FEF3D6` | `#C98A10` | `Clock` |
| GOOD | `#E3F5ED` | `#2A9D6A` | `Check` |
| EASY | `#E0F4FA` | `#2B8FC0` | `Zap` |

### 2.6 Topic dynamic color

Từ `topics.color_hex` (API):
- Chip background: `color_hex` @ 15% opacity
- Chip border: `color_hex` @ 40% opacity
- Fallback: `#5B8DEF`

### 2.7 Gradient (tiết chế)

Chỉ Auth hero / marketing strip:

```css
background: linear-gradient(135deg, #EBF3FE 0%, #F0EDFE 50%, #FEF3D6 100%);
```

**Không** dùng gradient trên Review/Quiz.

### 2.8 CSS Variables (`frontend/src/index.css`)

```css
:root {
  --color-bg: #F6F7F9;
  --color-surface: #FFFFFF;
  --color-primary: #4255FF;
  --color-primary-hover: #3245EE;
  --color-primary-subtle: #EDEFFD;
  --color-text: #282E3D;
  --color-text-secondary: #586380;
  --color-text-muted: #939BB4;
  --color-border: #E4E6EB;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-pill: 9999px;
  --shadow-sm: 0 1px 2px rgba(40, 46, 61, 0.06);
  --shadow-card: 0 1px 3px rgba(40, 46, 61, 0.08);
}
```

**Shadow:** chỉ dùng nhẹ trên card/modal — **không** lift 3D, không `translateY` trên hover.

### 2.9 Tailwind v4 `@theme` (khi implement)

```css
@theme {
  --color-lumo-bg: #F6F7F9;
  --color-lumo-surface: #FFFFFF;
  --color-lumo-primary: #4255FF;
  --color-lumo-primary-subtle: #EDEFFD;
  --color-lumo-text: #282E3D;
  --color-lumo-muted: #939BB4;
  --color-lumo-border: #E4E6EB;
}
```

---

## 3. Typography & Spacing

### 3.1 Font stack

Ba font Google Fonts — load trong `frontend/index.html`:

| Vai trò | Font | CSS variable | Dùng cho |
|---|---|---|---|
| **UI (mặc định)** | **Plus Jakarta Sans** | `--font-sans` | Nav, button, heading, body, quiz, dashboard |
| **Card front (EN)** | **Literata** | `--font-card-front` | Từ/câu tiếng Anh trên flashcard (`cards.front`) |
| **Card back (VI)** | **Be Vietnam Pro** | `--font-card-back` | Nghĩa, example, hint (`cards.back`, `example`) |

**Fallback:** `system-ui, sans-serif` (sans) · `Georgia, serif` (Literata)

**Số liệu:** `font-variant-numeric: tabular-nums` cho XP, streak, timer

**Phonetic IPA:** Plus Jakarta Sans italic (cùng `--font-sans`)

```css
:root {
  --font-sans: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-card-front: 'Literata', Georgia, serif;
  --font-card-back: 'Be Vietnam Pro', system-ui, sans-serif;
}

html { font-family: var(--font-sans); }

.flashcard-front { font-family: var(--font-card-front); }
.flashcard-back  { font-family: var(--font-card-back); }
```

### 3.2 Type scale

| Token | Font | Size | Weight | Line-height | Dùng cho |
|---|---|---|---|---|---|
| Display | Plus Jakarta Sans | 36px | 700 | 1.2 | Hero auth |
| H1 | Plus Jakarta Sans | 24px | 600 | 1.3 | Page title |
| H2 | Plus Jakarta Sans | 20px | 600 | 1.35 | Section title |
| Body | Plus Jakarta Sans | 16px | 400 | 1.5 | Nội dung UI |
| Body sm | Plus Jakarta Sans | 14px | 400 | 1.5 | Meta, table |
| Label | Plus Jakarta Sans | 12px | 500 | 1.4 | Badge, overline |
| Card word | **Literata** | 32px | 600 | 1.25 | Mặt trước flashcard (EN) |
| Card meaning | **Be Vietnam Pro** | 22px | 500 | 1.45 | Mặt sau flashcard (VI) |
| Card example | **Be Vietnam Pro** | 15px | 400 | 1.5 | Câu ví dụ trên thẻ |
| Phonetic | Plus Jakarta Sans | 16px | 400 italic | 1.4 | IPA |

### 3.3 Spacing (4px base)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

| Context | Padding |
|---|---|
| Page horizontal (mobile) | 16px |
| Page horizontal (desktop) | 24px |
| Card inner | 16–24px |
| Section gap | 24–32px |
| Button gap (icon+text) | 8px |

### 3.4 Icons

- **Library:** Lucide React
- **Stroke:** 2px (nav, action) · 1.75px (inline nhỏ)
- **Size:** 20px (nav), 24px (header action), 16px (meta)

---

## 4. Layout & Navigation

### 4.0 Viewport & tỷ lệ màn hình

**Desktop wireframe / thiết kế tham chiếu: 16:9**

| Artboard | Kích thước | Tỷ lệ | Ghi chú |
|---|---|---|---|
| Desktop (Figma & mockup) | **1440 × 810** | **16:9** | Chuẩn laptop/monitor phổ biến (tương đương 1920×1080 scale 75%) |
| Desktop Full HD | 1920 × 1080 | 16:9 | Cùng tỷ lệ; nội dung `max-w-6xl` vẫn căn giữa |
| Mobile | 390 × 844 | ~19.5:9 | Theo thiết bị thật (iPhone); **không** ép 16:9 |

**Trong code (React):** layout **fluid** — `width: 100%`, `min-height: 100vh`. Không khóa viewport 16:9; nội dung dài scroll dọc. Artboard 16:9 chỉ là khung thiết kế / Figma để bố cục vừa khung nhìn thấy ban đầu.

**Lưu ý:** breakpoint `lg: 1024px` là **chiều rộng** CSS, không phải tỷ lệ 16:9.

### 4.1 Breakpoints

| Token | Width | Layout |
|---|---|---|
| default | < 640px | 1 col, bottom nav |
| `sm` | ≥ 640px | 2 col deck grid |
| `md` | ≥ 768px | Sidebar, ẩn bottom nav |
| `lg` | ≥ 1024px | 3 col grid, auth split |
| `xl` | ≥ 1280px | `max-w-6xl` centered |

### 4.2 MainLayout (desktop `md+`) — Quizlet-style

```
┌────────────┬──────────────────────────────────────────┐
│ Sidebar    │  Header: [Search pill····]  [+] [Avatar] │
│ 248px      │  ──────────────────────────────────────── │
│            │  Main (bg #F6F7F9, max-w-5xl)             │
│ Logo       │                                          │
│ Nav links  │                                          │
│ ─────────  │                                          │
│ Bắt đầu    │                                          │
│ tại đây    │                                          │
└────────────┴──────────────────────────────────────────┘
```

**Sidebar nav:** Trang chủ · Thư viện của bạn · Khám phá · Tiến độ

**Nav active:** nền `#EDEFFD`, chữ `#4255FF`, bo góc 10px — không shadow nặng.

**Header search:** pill full-width (max ~640px), nền `#F6F7F9`, submit → `/explore?q=`.

**Nút + (tạo):** circle 40px, primary blue → `/library`.

### 4.3 MainLayout (mobile)

```
┌────────────────────────────────────┐
│ Logo              [+]    [Avatar]  │
├────────────────────────────────────┤
│ [Search pill full width]           │
├────────────────────────────────────┤
│         Main content               │
├────────────────────────────────────┤
│ Trang chủ │ Thư viện │ Khám phá │ … │  ← bottom nav
└────────────────────────────────────┘
```

### 4.4 MinimalLayout (Review / Quiz)

- Không sidebar, không bottom nav
- Header mỏng 48px: đóng · tiêu đề · progress
- Nội dung full-height centered
- Footer cố định cho actions (rating / submit)

### 4.5 Route map

| Route | Page | Layout |
|---|---|---|
| `/login` | Login | AuthLayout |
| `/register` | Register | AuthLayout |
| `/` | Landing (marketing) | Standalone |
| `/home` | Dashboard (Trang chủ) | MainLayout |
| `/library` | Thư viện deck | MainLayout |
| `/explore` | Khám phá | MainLayout |
| `/decks/:deckRef` | Deck Detail | MainLayout |
| `/decks/:deckRef/review` | Review | MinimalLayout |
| `/decks/:deckRef/quiz` | Quiz | MinimalLayout |
| `/progress` | Progress | MainLayout |
| `/settings` | Profile / cài đặt | MainLayout |
| `/leaderboard` | Leaderboard | MainLayout |
| `/admin` | Admin overview | MainLayout |

---

## 5. Component Library

Path: `frontend/src/components/ui/`

### 5.1 Atoms

**Button**
- Variants: `primary` | `secondary` | `outline` | `ghost`
- Sizes: `sm` | `md` | `lg`
- **Radius: pill (`rounded-full`)** — giống Quizlet Continue / CTA
- Primary: bg `#4255FF`, text white; hover `#3245EE`
- Outline: border `#D0D4DC`, hover border/text primary
- Ghost: transparent, hover `#EDEFFD`
- Disabled: opacity 50%, no pointer
- **Không** dùng shadow nặng hay `translateY` trên hover

**Search (`AppSearchBar`)**
- Class `.lumo-search`: pill, nền `#F6F7F9`, icon trái
- Focus: border primary + ring `#EDEFFD`

**Input / Textarea**
- Height 40px, radius 12px, border `#E8EDF4`
- Focus: ring 2px `#5B8DEF` offset 0
- Error: border `#F07167`, message 12px danger

**Badge**
- Pill, padding 4px 10px, 12px font
- Variants: `default` (primary-subtle) | `topic` (dynamic color)

**Avatar**
- Sizes: 32 | 40 | 48px circle
- Fallback: initials trên `#EBF3FE`, text `#5B8DEF`

**Skeleton**
- Shimmer `#F0F3F8` ↔ `#E8EDF4`, pulse 1.5s

### 5.2 Molecules

**DeckCard** (280px min-width)
- Cover 16:9, radius top 12px
- Title H2 truncate 2 lines
- Meta: `{n} thẻ` · owner
- ProgressBar mỏng 4px
- TopicChip row (max 2 visible)

**TopicChip**
- Emoji/icon + label, height 28px
- Selected: primary bg white text

**StatCard**
- Icon 24px trong circle 40px primary-subtle
- Số Display nhỏ (24px bold)
- Label body sm muted

**ProgressBar**
- Track `#E8EDF4` 6px radius full
- Fill gradient `#5B8DEF` → `#3CBF8A`

**RatingButtonGroup**
- Mobile: 2×2 grid, gap 8px, min-height 44px
- Desktop: 1×4 row
- Mỗi nút: icon + label 12px

### 5.3 Organisms

**FlashCard**
- Max-width 480px, min-height 360px
- Flip 3D `rotateY` (Framer Motion)
- Front (`flashcard-front`): **Literata** — word EN, phonetic (Plus Jakarta italic), image, audio btn
- Back (`flashcard-back`): **Be Vietnam Pro** — nghĩa VI, example, hint
- Tap anywhere hoặc nút "Lật thẻ" để flip

**HeatmapCalendar**
- Ô 12×12px, gap 3px, radius 2px
- 5 levels: `#EBF3FE` → `#B8D4FA` → `#7BB3F5` → `#5B8DEF` → `#4A7FE0`

**LeaderboardTable**
- Top 3 podium (desktop): heights 80/100/64px
- Medal colors: gold `#FFD166`, silver `#C0C8D4`, bronze `#E8A87C`
- Current user row: `primary-subtle` bg

**ImportDropzone**
- Dashed 2px `#5B8DEF`, radius 16px, min-height 160px
- Drag active: bg `#EBF3FE`

**JobProgressModal**
- Spinner + "Đang xử lý..." + poll status từ `/jobs/{id}`

---

## 6. Page Specifications

### 6.1 Login (`/login`)

**Desktop:** Split 50/50 — trái gradient hero + tagline "Học từ vựng thông minh với SRS"; phải form card.

**Form fields:** Email, Password

**Actions:** "Đăng nhập" primary full-width · link "Chưa có tài khoản? Đăng ký"

**States:** loading spinner trên button · error toast từ API

```
┌─────────────────────┬─────────────────────┐
│  Gradient hero      │  ┌───────────────┐  │
│  Lumotus logo       │  │ Đăng nhập     │  │
│  Tagline            │  │ [email]       │  │
│                     │  │ [password]    │  │
│                     │  │ [Đăng nhập]   │  │
│                     │  └───────────────┘  │
└─────────────────────┴─────────────────────┘
```

### 6.2 Register (`/register`)

Tương tự Login; thêm Username, Confirm password.

Validation inline: email format, password ≥ 8 ký tự, match confirm.

### 6.3 Dashboard (`/home`) — Trang chủ Quizlet-style

**Sections (top → bottom):**

1. **Quay lại học ngay** — horizontal scroll 2–4 thẻ lớn; mỗi thẻ: title, `{n} thẻ`, nút pill **Tiếp tục** (primary full-width trong card)
2. **Gần đây** — list row (icon tile + title + meta `{n} thẻ · bởi {user}`); link «Thư viện →»
3. **Gợi ý tham khảo** — scroll ngang deck công khai; meta có `ownerUsername`; link «Xem thêm →» `/explore`

**Empty state (chưa có deck):** card giữa trang + CTA «Tạo deck» / «Khám phá»

**Không** dùng grid feature roadmap trên trang chủ — giữ gọn như Quizlet.

**Sprint 4+:** thêm Due CTA khi có SRS (`12 thẻ đến hạn`).

### 6.4 Explore (`/explore`)

- Search **ở header** (`AppSearchBar`) — query `?q=` trên URL
- Trang explore: topic chips + grid deck
- Mỗi DeckCard: owner, view/copy count
- Empty: dashed border, copy gợi ý bật công khai

### 6.4b Library (`/library`)

- Title «Thư viện của bạn» + count deck
- Actions: Import CSV (outline) · Tạo deck (primary pill)
- Grid DeckCard variant `library` — badge riêng tư/công khai, footer «Copy từ …» nếu có `source_deck_id`

### 6.5 Deck Detail (`/decks/:id`)

**Hero band** (height ~200px): cover image hoặc gradient topic; overlay title + owner + badge `en → vi`

**Action bar:**
- Visitor: Học thẻ (primary) · Quiz (secondary) · Copy (ghost)
- Owner: + Sửa · Xóa · Tags

**Tabs:** Thẻ | Tiến độ | Cài đặt

**Tab Thẻ:** table/list — front, phonetic, star icon; pagination; FAB "+" (mobile)

**Tab Tiến độ:** ProgressBar learned/mastered, last studied date

**Tab Cài đặt:** title, description, public toggle, topic select (nếu public)

### 6.6 Review (`/decks/:id/review`) — Core UX

**MinimalLayout**, bg `#F6F8FB`

```
┌────────────────────────────────────┐
│ [X]  Travel Vocabulary    3/20  ★  │  ← header 48px
├────────────────────────────────────┤
│                                    │
│         ┌──────────────────┐       │
│         │    abundant      │       │
│         │  /əˈbʌndənt/     │       │
│         │  [  image  ]     │       │
│         │      🔊          │       │
│         │  Tap to flip     │       │
│         └──────────────────┘       │
│                                    │
├────────────────────────────────────┤
│ [Again] [Hard] [Good] [Easy]       │  ← sau flip
└────────────────────────────────────┘
```

- Rating row ẩn cho đến khi flip
- Session end modal: XP earned, "Học tiếp" / "Về deck"

### 6.7 Quiz (`/decks/:id/quiz`)

**Pre-start:** chọn số câu (10/20/all), loại MCQ/TF; button "Bắt đầu"

**In-quiz:**
- Timer ring top-right (warning < 30s)
- Progress dots
- Question text H1
- 4 option buttons (full-width stack)
- Selected: border primary, bg primary-subtle

**Result:** score % lớn, XP badge, list đúng/sai, "Làm lại" / "Về deck"

### 6.8 Progress (`/progress`)

1. Streak cards: hiện tại + kỷ lục
2. HeatmapCalendar 52 tuần × 7 ngày
3. Line chart XP (toggle 7d / 30d)
4. Stats grid 2×2: tổng thẻ · mastered · quiz · phút học

### 6.9 Leaderboard (`/leaderboard`)

- Podium top 3 (desktop only)
- Table rank 1–50: #, avatar, username, XP, streak
- Highlight current user
- Footer note: "Cập nhật mỗi phút"

### 6.10 Admin (`/admin`)

Sub-nav tabs: Users | Topics | Decks | Stats

- **Users:** table paginated, ban/unban toggle
- **Topics:** CRUD form với color picker (`color_hex`), icon, sort_order
- **Decks popular:** table view/copy count
- **Stats:** 4× StatCard tổng hệ thống

---

## 7. Motion & Micro-interactions

| Interaction | Spec |
|---|---|
| Page enter | opacity 0→1, 150ms ease |
| Card flip | rotateY 0→180°, 400ms spring (stiffness 260) |
| Button hover | scale 1.02, 150ms |
| Toast | slide from top, react-hot-toast |
| Skeleton | pulse 1.5s infinite |
| XP gain | "+10 XP" float up fade 800ms sau rate GOOD |
| Deck card hover | shadow lift, translateY -2px |

**Reduced motion:** `@media (prefers-reduced-motion: reduce)` — crossfade thay flip 3D

---

## 8. Accessibility

- Focus ring: 2px `#5B8DEF`, offset 2px
- SRS buttons: `aria-label="Đánh giá: Tốt (Good)"`
- Flashcard region: `aria-live="polite"` khi đổi thẻ
- Form errors: `aria-describedby` link tới message
- Touch target ≥ 44×44px (mobile)
- Không truyền đạt thông tin chỉ bằng màu (luôn có icon/text)

---

## 9. Loading & Empty States

| Context | Pattern |
|---|---|
| Deck list | Skeleton DeckCard × 6 |
| Card list | Skeleton rows × 10 |
| Review | Skeleton FlashCard centered |
| Explore empty | Icon + "Chưa có deck công khai" |
| Error API | Toast danger + retry button |
| Import/AI job | JobProgressModal polling 2s |

---

## 10. Implementation Checklist (Giai đoạn 3)

1. [ ] Cập nhật `index.css` tokens (thay dark palette hiện tại)
2. [ ] `components/ui/` — Button, Input, Badge, Avatar, Skeleton
3. [ ] Layouts — MainLayout, AuthLayout, MinimalLayout
4. [ ] Pages theo thứ tự: Auth → Dashboard → Explore → Deck Detail → Review → Quiz → Progress → Leaderboard → Admin
5. [ ] Framer Motion FlashCard flip
6. [ ] Chart.js heatmap + line chart trên Progress
7. [ ] Responsive QA mobile / tablet / desktop

---

## 11. Phase 2 — Dark Mode (optional)

| Token | Light | Dark |
|---|---|---|
| bg | `#F6F8FB` | `#13131F` |
| surface | `#FFFFFF` | `#1E1E2E` |
| text | `#1A2332` | `#E2E8F0` |
| border | `#E8EDF4` | `#3B3B52` |
| primary | `#5B8DEF` | `#7BA3F7` |

Toggle qua `data-theme="dark"` trên `<html>` + Zustand `uiStore`.

---

*Tài liệu UI — Lumotus · Cập nhật: 2026-06-07 · Tham chiếu wireframe: [`figma-wireframe-spec.md`](figma-wireframe-spec.md)*
