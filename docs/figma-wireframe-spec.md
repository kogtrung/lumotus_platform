# Figma Wireframe Spec — Lumotus

Input có cấu trúc để AI (Figma MCP) vẽ **low-fidelity wireframe**. Đọc kèm `[ui-design-plan.md](ui-design-plan.md)` cho ngữ cảnh UX.  
Link: [https://www.figma.com/design/Ar70HHusN5Ladp7d6jPRFx](https://www.figma.com/design/Ar70HHusN5Ladp7d6jPRFx)

**Lệnh gợi ý sau khi MCP kết nối:**

> Tạo file Figma "Lumotus — Wireframes" và vẽ tất cả frames theo `figma-wireframe-spec.md`. Style: wireframe, khối màu + label text. Font: Plus Jakarta Sans (UI), Literata (card front), Be Vietnam Pro (card back). Desktop frame 1440×810 (16:9).

---

## 0. Global Settings

### 0.1 Figma file structure


| Page name      | Nội dung                     |
| -------------- | ---------------------------- |
| `00 — Tokens`  | Color swatches + text styles |
| `01 — Desktop` | Frames **1440×810** (16:9)   |
| `02 — Mobile`  | Frames 390×844               |


### 0.2 Artboard sizes


| Platform        | Width | Height  | Aspect   | Content max-width           |
| --------------- | ----- | ------- | -------- | --------------------------- |
| Desktop         | 1440  | **810** | **16:9** | 1152 (margin 144 each side) |
| Desktop FHD ref | 1920  | 1080    | 16:9     | optional second artboard    |
| Mobile          | 390   | 844     | ~19.5:9  | 358 (padding 16 each side)  |


### 0.3 Typography (Figma text styles)


| Style name           | Font               | Weight     | Size | Dùng cho                    |
| -------------------- | ------------------ | ---------- | ---- | --------------------------- |
| `type/ui/body`       | Plus Jakarta Sans  | 400        | 16   | Body, nav, button           |
| `type/ui/heading`    | Plus Jakarta Sans  | 600        | 24   | Page title                  |
| `type/ui/label`      | Plus Jakarta Sans  | 500        | 12   | Badge, caption              |
| `type/card/front`    | **Literata**       | 600        | 32   | Từ tiếng Anh trên flashcard |
| `type/card/back`     | **Be Vietnam Pro** | 500        | 22   | Nghĩa tiếng Việt            |
| `type/card/example`  | **Be Vietnam Pro** | 400        | 15   | Example sentence            |
| `type/card/phonetic` | Plus Jakarta Sans  | 400 italic | 16   | IPA                         |


### 0.4 Wireframe style rules

- **Không** dùng ảnh thật — placeholder rectangle + label "IMAGE"
- **Không** shadow phức tạp — chỉ stroke `#E8EDF4` hoặc fill phẳng
- **Font UI:** Plus Jakarta Sans (fallback Arial)
- **Font card front:** Literata · **card back:** Be Vietnam Pro
- **Corner radius:** card 16px, button 12px, chip 999px (pill)
- **Annotation:** text 10px `#8B9BB4` góc frame ghi tên màn

### 0.5 Color palette (tạo swatches trên page `00 — Tokens`)


| Name           | Hex       | Figma style name      |
| -------------- | --------- | --------------------- |
| bg             | `#F6F8FB` | `lumo/bg`             |
| surface        | `#FFFFFF` | `lumo/surface`        |
| primary        | `#5B8DEF` | `lumo/primary`        |
| primary-subtle | `#EBF3FE` | `lumo/primary-subtle` |
| secondary      | `#8B7CF6` | `lumo/secondary`      |
| text-primary   | `#1A2332` | `lumo/text`           |
| text-muted     | `#8B9BB4` | `lumo/text-muted`     |
| border         | `#E8EDF4` | `lumo/border`         |
| success        | `#3CBF8A` | `lumo/success`        |
| warning        | `#F0B429` | `lumo/warning`        |
| danger         | `#F07167` | `lumo/danger`         |
| xp-gold        | `#F5C542` | `lumo/xp`             |
| streak         | `#FF9B5E` | `lumo/streak`         |


**SRS rating fills:**


| Name  | Bg        | Text      |
| ----- | --------- | --------- |
| again | `#FEE8E6` | `#D94F4F` |
| hard  | `#FEF3D6` | `#C98A10` |
| good  | `#E3F5ED` | `#2A9D6A` |
| easy  | `#E0F4FA` | `#2B8FC0` |


### 0.6 Shared components (tạo trên page `00 — Tokens`)

**Sidebar (desktop)** — width 240, height full, fill surface, stroke-right border

- Logo text "Lumotus" Plus Jakarta Sans 20px bold primary, y=24
- Nav items (height 40 each, gap 4): Home, Explore, Review, Progress, Leaderboard — Plus Jakarta 14px
- Active item: fill primary-subtle, text primary
- Footer y=bottom-80: Avatar circle 40px + "user@mail" 12px muted

**BottomNav (mobile)** — width 390, height 56, fill surface, stroke-top border

- 5 items equal width: Home, Explore, Review, Progress, Me — icon 20px + label 10px

**Button/Primary** — height 40, radius 12, fill primary, text white 14px semibold, padding 16 horizontal

**Button/Secondary** — height 40, radius 12, fill surface, stroke border, text text-primary

**Input** — height 40, width 100%, radius 12, fill surface, stroke border, placeholder text-muted 14px

**DeckCard** — width 260, height 220, radius 12, fill surface, stroke border

- Image area top 120px fill primary-subtle label "COVER"
- Title 14px semibold y=130
- Meta "24 thẻ" 12px muted y=152
- Progress bar 4px y=170 width 90%

---

## 1. Login — Desktop `1440×810`

**Frame name:** `Login / Desktop`

- **Background:** fill `bg` full frame
- **Left panel** x=0, w=720, h=810, fill gradient `#EBF3FE` → `#F0EDFE` → `#FEF3D6` angle 135
  - Logo "Lumotus" x=80 y=120, 32px bold `#5B8DEF`
  - Tagline "Học từ vựng thông minh với SRS" x=80 y=170, 18px `#5A6B82`
  - Decorative circles opacity 30%: circle 200px `#5B8DEF` x=500 y=600
- **Right panel** x=720, w=720, centered form card:
  - Card x=860 y=200, w=400, h=420, fill surface, radius 24, stroke border
  - "Đăng nhập" H1 24px semibold x=892 y=312
  - Input Email y=360 w=336 label "Email"
  - Input Password y=420 w=336 label "Mật khẩu"
  - Button Primary "Đăng nhập" y=490 w=336
  - Link "Chưa có tài khoản? Đăng ký" y=540 14px primary center

---

## 2. Login — Mobile `390×844`

**Frame name:** `Login / Mobile`

- Background `bg`
- Card x=16 y=120 w=358 h=480 fill surface radius 24
- Logo "Lumotus" center y=150 24px primary
- "Đăng nhập" y=200
- Email input y=250 w=326
- Password input y=310 w=326
- Button Primary y=380 w=326
- Link đăng ký y=430 center

---

## 3. Register — Desktop `1440×810`

**Frame name:** `Register / Desktop`

- Giống Login Desktop; form card height 520
- Fields: Username, Email, Password, Confirm password (gap 56px each)
- Button "Đăng ký" primary
- Link "Đã có tài khoản? Đăng nhập"

---

## 4. Register — Mobile `390×844`

**Frame name:** `Register / Mobile`

- Card height 560, scroll implied
- 4 inputs + button + link (same as desktop stacked)

---

## 5. Dashboard — Desktop `1440×810`

**Frame name:** `Dashboard / Desktop`

- Background `bg`
- **Sidebar** component x=0 (shared 240px)
- **Main** x=240 w=1200:
  - Greeting "Xin chào, learning_champion" x=272 y=32 24px semibold
  - Streak chip x=600 y=36: fill `#FF9B5E` 20% bg, text "🔥 5 ngày" 12px
  - XP chip x=700 y=36: fill `#F5C542` 20% bg, text "⭐ 1250 XP"
  - **Due CTA card** x=272 y=88 w=1100 h=100 fill primary-subtle radius 16
    - Text "12 thẻ đến hạn hôm nay" 18px semibold x=296 y=108
    - Button Primary "Bắt đầu ôn" x=1100 y=108 w=140
  - **Stats row** y=210: 3× StatCard w=350 h=90 gap 24
    - "248 Đã học" | "86 Đã thuộc" | "3 Quiz tuần này"
  - **Section title** "Deck gần đây" y=330 20px semibold
  - **Deck grid** y=370: 3× DeckCard horizontal gap 24
  - **Shortcuts** y=620: 3 tiles w=350 h=80 fill surface radius 12
    - "📁 Import" | "✨ AI Generate" | "🔍 Khám phá"

---

## 6. Dashboard — Mobile `390×844`

**Frame name:** `Dashboard / Mobile`

- Background `bg`, no sidebar
- Topbar y=0 h=56: Logo left, Avatar right 32px
- Greeting y=72 padding 16
- Streak + XP chips row y=108
- Due CTA card y=150 w=358 h=88
- Stats: 3 mini cards horizontal scroll y=260
- "Deck gần đây" y=340
- DeckCard horizontal scroll y=370 (2 cards visible)
- Shortcuts row y=620 3 icons
- **BottomNav** y=788

---

## 7. Explore — Desktop `1440×810`

**Frame name:** `Explore / Desktop`

- Sidebar + Main layout
- Page title "Khám phá" y=32
- Search input full width y=80 h=44 placeholder "Tìm deck, từ vựng..."
- **Topic chips** y=140 horizontal:
  - "Tất cả" selected fill primary text white
  - "✈️ Travel" | "💼 Business" | "📚 IELTS" chips outline
- **Deck grid** y=200: 4 columns × 2 rows DeckCard
- Each card: badge "Public" top-right 10px

---

## 8. Explore — Mobile `390×844`

**Frame name:** `Explore / Mobile`

- Topbar + search y=72
- Chips scroll horizontal y=130
- Deck grid 1 column y=190, 3 DeckCard stacked gap 16
- BottomNav

---

## 9. Deck Detail — Desktop `1440×810`

**Frame name:** `Deck Detail / Desktop`

- Sidebar + Main
- **Hero** x=272 y=32 w=1100 h=180 radius 16 fill gradient `#4F46E5` 30% → primary-subtle
  - Title "Travel Vocabulary" 28px white/bold y=80
  - Meta "by admin · 48 thẻ · en → vi" 14px y=120
- **Action bar** y=230:
  - Button Primary "Học thẻ" w=120
  - Button Secondary "Làm Quiz" w=120
  - Button Ghost "Copy deck" w=120
- **Tabs** y=290: "Thẻ" active underline primary | "Tiến độ" | "Cài đặt"
- **Card list** y=340:
  - Table header: Từ | Phiên âm | ★
  - 8 rows height 48 stroke-bottom border
  - Row example: "abundant" | "/əˈbʌndənt/" | star icon
- Pagination y=720: "< 1 2 3 >" (hoặc scroll nếu list dài)

---

## 10. Deck Detail — Mobile `390×844`

**Frame name:** `Deck Detail / Mobile`

- Hero h=140 full width
- Actions 3 buttons row scroll y=155
- Tabs y=210
- Card list y=250 (5 rows)
- FAB "+" circle 56px primary bottom-right x=310 y=720
- BottomNav

---

## 11. Review — Desktop `1440×810`

**Frame name:** `Review / Desktop`

- **No sidebar** — MinimalLayout
- Background `bg` full frame
- **Header** y=0 h=56 fill surface stroke-bottom:
  - close x=32
  - Title "Travel Vocabulary" center 16px semibold
  - Progress "3 / 20" right x=1320
  - Star icon x=1380
- **FlashCard** center x=480 y=120 w=480 h=400 fill surface radius 16 stroke border
  - Word "abundant" **Literata** center 32px semibold text-primary y=240
  - Phonetic "/əˈbʌndənt/" Plus Jakarta italic center 16px muted y=290
  - Image placeholder 240×140 fill primary-subtle center y=340 label "IMAGE"
  - Audio button circle 40px y=500 center label "🔊"
  - Hint "Tap để lật thẻ" 12px muted y=560
- **Rating row** y=702 h=88 w=600 centered x=420 gap 12:
  - 4 buttons w=140 h=72 radius 12 each with SRS colors
  - Labels: Again | Hard | Good | Easy

---

## 12. Review — Mobile `390×844`

**Frame name:** `Review / Mobile`

- Header h=48: [X] title "Travel Vocab" "3/20" [★]
- FlashCard x=16 y=100 w=358 h=400
- Rating 2×2 grid y=720 w=358 h=100 gap 8
- **No bottom nav**

---

## 13. Quiz — Desktop `1440×810`

**Frame name:** `Quiz / Desktop`

- MinimalLayout bg
- Header: [X] "Quiz — Travel Vocabulary" | Timer ring 48px "2:45" right
- Progress dots center y=80 (8 dots, 3 filled primary)
- Question card x=320 y=160 w=800 min-h=120 fill surface radius 16 padding 24
  - "What does 'abundant' mean?" 20px semibold
- **Options** y=320 w=800 gap 12:
  - 4× option button h=56 fill surface stroke border radius 12
  - Option A "Plentiful" — one selected: fill primary-subtle stroke primary
  - B "Scarce" | C "Tiny" | D "Empty"
- Button Primary "Câu tiếp theo" bottom center y=720 w=200

---

## 14. Quiz — Mobile `390×844`

**Frame name:** `Quiz / Mobile`

- Timer top-right y=16
- Dots y=56
- Question y=100
- 4 options stacked y=200 full width 358
- Button bottom y=760 full width

---

## 15. Quiz Result — Desktop `1440×810`

**Frame name:** `Quiz Result / Desktop`

- Center card w=480 h=400 surface radius 24
- Score "85%" 48px bold success
- "17 / 20 câu đúng" 16px muted
- XP badge "+50 XP" fill xp-gold 20%
- 2 buttons: "Làm lại" secondary | "Về deck" primary

---

## 16. Progress — Desktop `1440×810`

**Frame name:** `Progress / Desktop`

- Sidebar + Main
- Title "Tiến độ học tập" y=32
- **Streak cards** y=88: 2 cards w=350 h=100
  - "🔥 Streak hiện tại: 5" | "🏆 Kỷ lục: 12"
- **Heatmap** y=220 w=1100 h=140
  - Label "Hoạt động 365 ngày"
  - Grid 52×7 squares 12px gap 3px (5 blue intensity levels)
- **Chart placeholder** y=400 w=1100 h=200 fill surface radius 12 label "LINE CHART — XP 7 ngày"
- **Stats grid** y=640 2×2 StatCard

---

## 17. Progress — Mobile `390×844`

**Frame name:** `Progress / Mobile`

- Streak cards stacked y=72
- Heatmap scroll horizontal y=200 h=100
- Chart y=320 h=160
- Stats 2 col y=500
- BottomNav

---

## 18. Leaderboard — Desktop `1440×810`

**Frame name:** `Leaderboard / Desktop`

- Sidebar + Main
- Title "Bảng xếp hạng" + badge "Cập nhật mỗi phút" muted
- **Podium** y=100 center w=600 h=160:
  - 2nd left h=100 silver | 1st center h=130 gold | 3rd right h=80 bronze
  - Avatars + username + XP under each
- **Table** y=300 w=1100:
  - Header: # | Người chơi | XP | Streak
  - Rows 4–15 (sample data)
  - Row 8 highlight fill primary-subtle "(bạn)"
- Current user sticky note if off-screen

---

## 19. Leaderboard — Mobile `390×844`

**Frame name:** `Leaderboard / Mobile`

- Compact list no podium (or mini top 3 horizontal)
- Rows full width avatar + name + XP
- BottomNav

---

## 20. Admin — Desktop `1440×810`

**Frame name:** `Admin / Desktop`

- Sidebar with "Admin" badge danger-subtle on logo area
- Sub-nav tabs y=32: Users | Topics | Decks | Stats — "Users" active
- **Stats row** (when Stats tab): 4 StatCard — Users | Decks | Cards | Quizzes
- **Users table** y=120:
  - Columns: Username | Email | Role | Status | Actions
  - 10 rows sample
  - Action: toggle "Ban" / "Active"
- **Topics form** (alternate frame `Admin Topics / Desktop`):
  - Fields: Name, Slug, Icon, Color picker swatch, Sort order
  - Button "Lưu topic"

---

## 21. Admin — Mobile `390×844`

**Frame name:** `Admin / Mobile`

- Simplified: tab scroll + card list thay table
- User cards với ban button

---

## 22. Draw Order (cho AI)

Vẽ theo thứ tự sau trên từng page:

1. Page `00 — Tokens`: swatches + 5 shared components
2. Page `01 — Desktop`: frames 1, 3, 5, 7, 9, 11, 13, 15, 16, 18, 20
3. Page `02 — Mobile`: frames 2, 4, 6, 8, 10, 12, 14, 17, 19, 21

**Spacing giữa frames trên cùng page:** 200px horizontal gap

---

## 23. Sample Content (placeholder text)


| Field      | Sample                                          |
| ---------- | ----------------------------------------------- |
| Username   | learning_champion                               |
| Email      | [user@lumotus.local](mailto:user@lumotus.local) |
| Deck title | Travel Vocabulary                               |
| Card front | abundant                                        |
| Card back  | nhiều, dồi dào                                  |
| Phonetic   | /əˈbʌndənt/                                     |
| Topic      | Travel, Business, IELTS                         |
| XP         | 1250                                            |
| Streak     | 5                                               |


---

*Figma Wireframe Spec — Lumotus · 2026-06-07 · Phase B: dùng file này với Figma MCP*