# Kế hoạch giao diện — Lumotus

Tài liệu thiết kế UI/UX cho ứng dụng học từ vựng Tiếng Anh **Lumotus** (SRS SM-2, Quiz, XP, AI Generate).

**Liên quan:** [`spec.md`](spec.md) (API & nghiệp vụ) · [`flashcard-project-plan.md`](flashcard-project-plan.md) (roadmap) · [`figma-wireframe-spec.md`](figma-wireframe-spec.md) (input vẽ wireframe Figma)

**Theme:** Dark-first (Sprint 4b) · Concept **"Lush & Vibrant"** — màu sắc đậm đà, gradient nhấn mạnh, glow effects, độ tương phản cao. Đã triển khai dark theme toàn hệ thống.

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
| `bg` | `#F1F3F8` | Nền vùng nội dung chính |
| `surface` | `#FFFFFF` | Sidebar, header, card, modal |
| `border-subtle` | `#E2E5EC` | Viền card, divider |
| `border-strong` | `#C8CDD9` | Viền input/outline button |
| `primary` | `#6366F1` | CTA, link active, logo mark (indigo) |
| `primary-hover` | `#4F46E5` | Hover CTA |
| `primary-deep` | `#4338CA` | Deep variant |
| `primary-subtle` | `#EEF2FF` | Nav active, chip selected, icon tile |
| `primary-glow` | `rgba(99,102,241,0.4)` | Glow effect |
| `accent` | `#F97316` | Gamification, CTA đặc biệt (orange) |
| `accent-hover` | `#EA580C` | Hover accent |
| `accent-subtle` | `#FFF7ED` | Accent background |
| `secondary` | `#475569` | Text phụ, secondary button |
| `secondary-subtle` | `#F1F5F9` | Nền tile nhẹ |

### 2.2 Semantic

| Token | Hex | Dùng cho |
|---|---|---|
| `success` | `#10B981` | Hoàn thành, đúng quiz |
| `success-subtle` | `#ECFDF5` | Success background |
| `warning` | `#F59E0B` | Timer sắp hết, cảnh báo |
| `warning-subtle` | `#FFFBEB` | Warning background |
| `danger` | `#EF4444` | Lỗi, xóa |
| `danger-subtle` | `#FEF2F2` | Danger background |

### 2.3 Text

| Token | Hex | Dùng cho |
|---|---|---|
| `text-primary` | `#0F172A` | Tiêu đề, nội dung chính |
| `text-secondary` | `#475569` | Mô tả phụ |
| `text-muted` | `#94A3B8` | Caption, placeholder |
| `text-inverse` | `#FFFFFF` | Text trên nút primary |

### 2.4 Gamification

| Token | Hex | Dùng cho |
|---|---|---|
| `xp-gold` | `#F59E0B` | Icon XP, badge điểm, glow effect |
| `xp-gold-subtle` | `#FEF3C7` | XP background |
| `streak-flame` | `#EF4444` | Chuỗi ngày học, glow effect |
| `streak-subtle` | `#FEF2F2` | Streak background |
| `star` | `#FBBF24` | Thẻ đã đánh dấu sao |

### 2.5 SRS Rating Buttons (Enhanced)

| Rating | Background | Text/Icon | Shadow |
|---|---|---|---|
| AGAIN | `#FEE2E2` → `#FCA5A5` | `#B91C1C` | Red glow `rgba(239,68,68,0.3)` |
| HARD | `#FEF9C3` → `#FCD34D` | `#B45309` | Amber glow `rgba(245,158,11,0.3)` |
| GOOD | `#D1FAE5` → `#6EE7B7` | `#047857` | Emerald glow `rgba(16,185,129,0.3)` |
| EASY | `#DBEAFE` → `#93C5FD` | `#1D4ED8` | Blue glow `rgba(59,130,246,0.3)` |

Button style: 3D effect với gradient background, border accent, và shadow đáy 4px.

### 2.6 Topic dynamic color

Từ `topics.color_hex` (API):
- Chip background: `color_hex` @ 15% opacity
- Chip border: `color_hex` @ 40% opacity
- Fallback: `#5B8DEF`

### 2.7 Gradient & Glow Effects (Enhanced)

Sử dụng gradient cho hero sections, feature cards, và buttons:

```css
/* Hero gradient - indigo to purple to warm */
--gradient-hero: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 30%, #F3E8FF 70%, #FEF3C7 100%);

/* Brand gradient - indigo spectrum */
--gradient-brand: linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%);

/* Accent gradient - orange spectrum */
--gradient-accent: linear-gradient(135deg, #FB923C 0%, #F97316 50%, #EA580C 100%);

/* Glow effects */
--glow-primary: 0 0 20px rgba(99, 102, 241, 0.35), 0 0 40px rgba(99, 102, 241, 0.15);
--glow-accent: 0 0 20px rgba(249, 115, 22, 0.35), 0 0 40px rgba(249, 115, 22, 0.15);
--glow-gold: 0 0 16px rgba(245, 158, 11, 0.4);
--glow-flame: 0 0 16px rgba(239, 68, 68, 0.4);

/* Gradient border cards */
background: linear-gradient(surface, surface) padding-box,
            linear-gradient(135deg, primary, accent) border-box;
```

**Dùng gradient trên:** Landing hero, feature cards, CTA sections, rating buttons.

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

**FlashCard** (`ReviewFlashcard.tsx`)
- Max-width 480px, min-height 360px
- Flip 3D `rotateY` — **CSS 3D** (Framer Motion optional, đã có trong deps)
- Front (`flashcard-front`): word EN, phonetic, image, `CardAudioButton`
- Back (`flashcard-back`): nghĩa VI, example, hint
- Tap anywhere để flip; rating qua `RatingButtonGroup` ở footer

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

## 6.11 Landing Page (`/`) — Marketing Landing

### Overview

Landing page là trang marketing hiển thị cho khách (chưa đăng nhập). Mục tiêu: gây ấn tượng, giới thiệu tính năng, kêu gọi đăng ký.

### Sections

|| Section | Background | Falling objects | Content |
|---|---|---|---|
| Hero | Video background + gradient overlay | 6 botanical flashcard cards (25-50s) | Badge, giant heading, description, CTA buttons, stats |
| About | Dark `#1A1520` + gradient pink | 6 gentle botanical items (18-30s) | Heading multi-style, body text |
| Features | Dark `#1A1520` + gradient pink | 6 gentle botanical items | Stats strip (50K+, 500K+, 95% AI, 4.9★) + 4-card grid (dark glass) |
| CTA | Dark `#0a0614` + gradient | Botanical falling | Badge, heading, description, CTA buttons |

### Design tokens (Landing)

|| Token | Hex | Dùng cho |
|---|---|---|---|
| `gradient-hero` | `from-black/50 via-black/30 to-black/85` | Hero overlay |
| `gradient-cta` | `from-[#0a0614] via-[#1a0a2e] to-[#2d0a3a]` | CTA background |
| `brand-pink` | `#EC4899` | CTA button, accents, link |
| `brand-orange` | `#F97316` | Gradient end |
| `surface-light` | `#F8FAFC` | Features section bg |

### Header (scroll-aware)

- Always transparent (no background on scroll)
- Text color: `#F5F0FA` (white-ish) over all sections (all dark theme since Sprint 4b)
- Detection: `getBoundingClientRect` of `#hero-section` and `#cta-section` — simplifies to always white
- `pointer-events-none` on header + `pointer-events-auto` on children
- Nav links scroll to `#about-section`, `#features-section`, `#cta-section`

### Falling botanical cards

- 6 cards from `FALLING_FLASHCARDS` array (16 words, 1 meaning each)
- Botanical SVG on front face (stem + leaves + petal)
- Duration: 25-50s, `repeatDelay`: 8-20s, staggered delay 5-11s
- Click to flip: front (botanical) ↔ back (word + phonetic + meaning)

### BotanicalFalling component

- Props: `intensity: 'gentle' | 'normal' | 'dense'`
- Gentle: 6 items, 18-30s, opacity max 0.5
- Normal: 12 items, 10-16s
- Dense: 16 items, 10-16s

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

> **Đối chiếu yêu cầu đề tài:** [`spec.md`](spec.md) §8 · **Tiến độ:** [`progress.md`](progress.md)

1. [x] Cập nhật `index.css` tokens (Quizlet light)
2. [x] `components/ui/` — Button, Input, Badge, ImageUpload, AudioUpload…
3. [x] Layouts — MainLayout (sidebar icon/chữ), AuthLayout, MinimalLayout
4. [ ] Pages đầy đủ theo đề tài:
   - [x] Auth, Dashboard, Explore, Library, Deck Detail, Review
   - [ ] Quiz, Progress, Leaderboard, Admin
5. [ ] Framer Motion FlashCard flip *(hiện CSS 3D trong `ReviewFlashcard.tsx` — đạt UX, khác stack đề tài)*
6. [ ] Chart.js heatmap + line chart trên Progress (`StreakCalendar`)
7. [ ] Responsive QA mobile / tablet / desktop
8. [ ] Offline batch cache phiên review

### 10.1 Component đề tài ↔ code

| Đề tài | File hiện tại | Trạng thái |
|---|---|---|
| FlashCard | `components/review/ReviewFlashcard.tsx` | ⚠️ CSS 3D |
| ReviewRatingButtons | `components/review/RatingButtonGroup.tsx` | ✅ |
| StreakCalendar | — | ❌ Sprint 5 |
| DeckProgressBar | `DeckCard` progress mỏng | ⚠️ thiếu mastered/total |
| QuizTimer | — | ❌ Sprint 5 |
| LeaderboardTable | — | ❌ Sprint 5 |
| CardAudioButton | `components/review/CardAudioButton.tsx` | ✅ (mở rộng) |

---

## 11. Dark Mode ✅ (Sprint 4b)

> **Đã triển khai Sprint 4b** — Dark theme cho toàn bộ hệ thống.

| Token | Hex | Dùng cho |
|---|---|---|
| `bg` | `#1A1520` | Nền chính (deep purple-black) |
| `surface` | `#252030` | Sidebar, header, card, modal (80% opacity glass) |
| `elevated` | `#2D2538` | Card hover, elevated surface |
| `border` | `#3D3348` / `#4A4060` | Viền card, divider |
| `text-primary` | `#F5F0FA` | Tiêu đề, nội dung chính |
| `text-secondary` | `#C4B8D9` | Mô tả phụ |
| `text-muted` | `#8B7A9E` | Caption, placeholder |
| `primary` | `#EC4899` | CTA, link active (pink) |
| `accent` | `#F97316` | Accent gradient end (orange) |
| `glow-shadow` | `rgba(236,72,153,0.15)` | Card glow, button shadow |

**Background effect:** Ảnh hero mờ 6% + gradient overlay `#1A1520` + radial glow pink ở góc.

**Components affected:** MainLayout, LandingPage, LibraryPage, ExplorePage, DeckDetailPage, ReviewPage, ReviewFlashcard, DeckCard, CardGridItem.

---

*Tài liệu UI — Lumotus · Cập nhật: 2026-06-22 · Sprint 4b Dark Theme ✅*
