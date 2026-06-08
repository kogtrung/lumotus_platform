# Kế hoạch tổng thể — Lumotus (Fullstack FlashCard English)

> **Stack:** Spring Boot 3.x + React 18 + PostgreSQL + Redis · **Deploy:** VPS (Ubuntu + Docker + Nginx) · **Quy mô:** ~10–100 người dùng · **Hướng:** Quizlet-style

---

## 1. Tổng quan kiến trúc

| Tầng          | Công nghệ                                                                                              | Vai trò                                      |
| ---------------| --------------------------------------------------------------------------------------------------------| ----------------------------------------------|
| Frontend      | React 18 + TypeScript, Vite, TailwindCSS, Framer Motion, React Query, React Router v6, Axios, Chart.js | Giao diện người dùng, SPA                    |
| Backend       | Spring Boot 4, Spring Security, Spring Data JPA, Flyway, Swagger/OpenAPI                               | REST API, business logic                     |
| Auth          | JWT Access Token + Refresh Token (lưu Redis) + RBAC                                                    | Xác thực và phân quyền                       |
| Database      | PostgreSQL                                                                                             | Dữ liệu chính                                |
| Cache         | Redis                                                                                                  | Refresh token, leaderboard cache, job status |
| Async         | Spring `@Async` + `TaskDispatcher` interface                                                           | Xử lý AI generate và import file nền         |
| Reverse Proxy | Nginx                                                                                                  | SSL termination, serve static FE, proxy API  |
| Container     | Docker + Docker Compose                                                                                | Orchestrate toàn bộ stack                    |
| CI/CD         | GitHub Actions                                                                                         | Auto test → build → deploy lên VPS           |

---

## 2. Thiết kế CSDL — Schema đầy đủ

> ⚠️ **Nguyên tắc thiết kế:** Chuẩn 3NF, UUID cho primary key, audit fields tập trung vào `BaseEntity`, soft-delete bằng `deleted_at` cho các bảng quan trọng.

---

### 2.0 Base Entity — Lớp cha chung (JPA `@MappedSuperclass`)

> **Tư tưởng:** Thay vì copy-paste `created_at` / `updated_at` vào mọi bảng, ta tạo một abstract class `BaseEntity` dùng `@MappedSuperclass`. JPA sẽ tự map các field này vào bảng con mà **không tạo bảng riêng** trong DB. Mọi Entity chỉ cần `extends BaseEntity`.

#### `BaseEntity` — Các field dùng chung
| Field | Kiểu DB | Kiểu Java | Ghi chú |
|---|---|---|---|
| `id` | UUID | `UUID` | PK, `@GeneratedValue` với `gen_random_uuid()` |
| `created_at` | TIMESTAMPTZ | `Instant` | `@CreatedDate`, tự gán khi INSERT |
| `updated_at` | TIMESTAMPTZ | `Instant` | `@LastModifiedDate`, tự cập nhật khi UPDATE |

```java
// entity/common/BaseEntity.java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)  // bật Spring Data JPA Auditing
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
```

```java
// Bật Auditing trong config
@Configuration
@EnableJpaAuditing
public class JpaConfig { }
```

#### Phân loại kế thừa

| Loại | Kế thừa từ | Ghi chú |
|---|---|---|
| `BaseEntity` | — | `id` + `created_at` + `updated_at` |
| `SoftDeleteEntity` | `BaseEntity` | + thêm `deleted_at` cho soft-delete |

```java
// entity/common/SoftDeleteEntity.java
@MappedSuperclass
public abstract class SoftDeleteEntity extends BaseEntity {

    @Column(name = "deleted_at")
    private Instant deletedAt;  // NULL = còn tồn tại, có giá trị = đã xóa mềm

    public boolean isDeleted() {
        return deletedAt != null;
    }
}
```

#### Bảng nào kế thừa gì
| Bảng | Kế thừa | Lý do |
|---|---|---|
| `users` | `BaseEntity` | Không soft-delete user (dùng `is_active`) |
| `topics` | `BaseEntity` | Topic do admin quản lý, xóa thật |
| `decks` | `SoftDeleteEntity` | Xóa mềm để tránh mất dữ liệu |
| `cards` | `SoftDeleteEntity` | Xóa mềm, tránh ảnh hưởng SRS history |
| `quiz_questions` | `BaseEntity` | |
| `quiz_attempts` | `BaseEntity` | |
| `quiz_answers` | `BaseEntity` | |
| `async_jobs` | `BaseEntity` | |
| `user_card_review` | — | PK composite, không dùng UUID id |
| `user_deck_progress` | — | PK composite, không dùng UUID id |
| `deck_topics` | — | PK composite, không dùng UUID id |
| `deck_tags` | — | PK composite (deck\_id, user\_id, tag\_name) |
| `daily_activity` | — | PK composite, không dùng UUID id |

> **Lưu ý Flyway:** DB không biết về `@MappedSuperclass` — migration SQL vẫn viết đầy đủ các cột vào từng bảng như bình thường. `@MappedSuperclass` chỉ là abstraction ở tầng Java.

---

### 2.1 Sơ đồ quan hệ (ERD tóm tắt)

```
users ──< decks ──< cards
                      │
topics ──< deck_topics ─┘ (many-to-many: deck gắn vào system topic)

deck_tags (user_id, deck_id, tag_name) ← nhãn cá nhân do user tự gắn

users ──< user_card_review >── cards
users ──< quiz_attempts ──< quiz_answers >── quiz_questions >── decks
users ──< daily_activity
async_jobs >── users
```

### 2.2 Chi tiết từng bảng

> 📌 **Quy ước đọc bảng:** Các bảng kế thừa `BaseEntity` hoặc `SoftDeleteEntity` **đã bao gồm** `id`, `created_at`, `updated_at` (và `deleted_at`) — không liệt kê lại bên dưới để tránh trùng lặp.

#### `users` — Người dùng · *extends* `BaseEntity`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| *(id, created_at, updated_at)* | — | *kế thừa BaseEntity* | |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | |
| `password_hash` | VARCHAR(255) | NOT NULL | BCrypt |
| `avatar_url` | TEXT | NULL | Ảnh đại diện |
| `role` | ENUM(`USER`,`ADMIN`) | NOT NULL, DEFAULT `USER` | |
| `xp` | INT | NOT NULL, DEFAULT 0 | Tổng điểm kinh nghiệm |
| `streak` | INT | NOT NULL, DEFAULT 0 | Chuỗi ngày học liên tiếp |
| `last_study_date` | DATE | NULL | Để tính streak |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Khoá/mở tài khoản |
| `oauth_provider` | VARCHAR(20) | NULL | `GOOGLE` khi OAuth |
| `oauth_subject` | VARCHAR(255) | NULL | Google `sub`; unique với `oauth_provider` |

---

#### `topics` — Chủ đề hệ thống (Admin-only) · *extends* `BaseEntity`

> 📌 **Thiết kế:** `topics` là danh mục do Admin cuärate — tương tự **Subject** của Quizlet (Languages, Science, Math…). User **chỉ được chọn** topic khi tạo deck công khai, không được tự tạo. Điều này giữ cho trang Explore sạch, không spam.
> User muốn tự tổ chức → dùng **`deck_tags`** (bảng riêng phía dưới).

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| *(id, created_at, updated_at)* | — | *kế thừa BaseEntity* | |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | VD: "Travel", "Business", "IELTS" |
| `slug` | VARCHAR(120) | UNIQUE, NOT NULL | URL-friendly: `travel`, `ielts` |
| `description` | TEXT | NULL | |
| `icon` | VARCHAR(100) | NULL | Emoji hoặc tên icon (VD: `✈️`, `lucide:plane`) |
| `color_hex` | CHAR(7) | NULL | Màu đại diện topic, VD: `#4F46E5` |
| `sort_order` | INT | NOT NULL, DEFAULT 0 | Thứ tự hiển thị trên trang Explore |

**Quy tắc:**
- Admin tạo / sửa / ẩn topic → quản lý tập trung
- User chỉ **gắn deck công khai** vào 1–2 topic (qua `deck_topics`)
- Deck riêng tư không cần gắn topic

---

#### `decks` — Bộ thẻ · *extends* `SoftDeleteEntity`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| *(id, created_at, updated_at, deleted_at)* | — | *kế thừa SoftDeleteEntity* | |
| `title` | VARCHAR(200) | NOT NULL | |
| `description` | TEXT | NULL | |
| `cover_image_url` | TEXT | NULL | Ảnh bìa deck |
| `owner_id` | UUID | FK → `users.id` | |
| `owner_type` | ENUM(`USER`,`ADMIN`) | NOT NULL | |
| `is_public` | BOOLEAN | NOT NULL, DEFAULT FALSE | |
| `is_copyable` | BOOLEAN | NOT NULL, DEFAULT TRUE | Cho phép user copy deck (như Quizlet) |
| `language_front` | VARCHAR(10) | NOT NULL, DEFAULT `'en'` | ISO 639-1 (ngôn ngữ mặt trước) |
| `language_back` | VARCHAR(10) | NOT NULL, DEFAULT `'vi'` | ISO 639-1 (ngôn ngữ mặt sau) |
| `generated_by_ai` | BOOLEAN | NOT NULL, DEFAULT FALSE | |
| `generation_prompt` | TEXT | NULL | |
| `view_count` | INT | NOT NULL, DEFAULT 0 | Lượt xem |
| `copy_count` | INT | NOT NULL, DEFAULT 0 | Lượt copy |
| `search_vector` | TSVECTOR | GENERATED ALWAYS AS STORED | Full-text search (xem §2.3) |

---

#### `deck_topics` — Bảng trung gian Deck ↔ System Topic · *PK composite*
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `deck_id` | UUID | FK → `decks.id` | PK composite |
| `topic_id` | UUID | FK → `topics.id` | PK composite |
| `assigned_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Quy tắc:** Chỉ deck `is_public = true` mới có ý nghĩa khi gắn topic (vì mục đích là public discovery).

---

#### `deck_tags` — Nhãn cá nhân do User tự đặt ⭐ MỚI · *PK composite*

> 🏷️ **Mục đích:** Giúp user tự tổ chức deck của mình theo cách riêng — tương tự hashtag cá nhân. Hoàn toàn tách biệt khỏi `topics` hệ thống.

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `deck_id` | UUID | FK → `decks.id` | PK composite |
| `user_id` | UUID | FK → `users.id` | PK composite |
| `tag_name` | VARCHAR(50) | NOT NULL | PK composite, lowercase, trim |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Quy tắc:**
- User chỉ gắn tag vào deck mà họ sở hữu hoặc đã copy về
- Tag chỉ hiển thị với chính user đó (private)
- Không có global tag list → không spam, không trùng lặp
- Backend tự `lowercase().trim()` trước khi lưu

---

#### `cards` — Thẻ từ vựng ⭐ NÂNG CẤP LỚN · *extends* `SoftDeleteEntity`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| *(id, created_at, updated_at, deleted_at)* | — | *kế thừa SoftDeleteEntity* | |
| `deck_id` | UUID | FK → `decks.id`, NOT NULL | |
| `front` | TEXT | NOT NULL | Từ / câu phía trước |
| `back` | TEXT | NOT NULL | Nghĩa / câu phía sau |
| `phonetic` | VARCHAR(200) | NULL | ⭐ Phiên âm IPA, VD: `/træˈvɛl/` |
| `hint` | TEXT | NULL | Gợi ý nhỏ khi học |
| `example` | TEXT | NULL | Câu ví dụ sử dụng từ |
| `image_url` | TEXT | NULL | ⭐ URL ảnh minh hoạ (upload hoặc từ AI) |
| `icon` | VARCHAR(100) | NULL | ⭐ Emoji hoặc icon name (VD: `🚀`, `lucide:rocket`) |
| `audio_url` | TEXT | NULL | ⭐ URL file phát âm (TTS hoặc upload) |
| `part_of_speech` | VARCHAR(50) | NULL | Từ loại: noun, verb, adjective… |
| `difficulty` | ENUM(`EASY`,`MEDIUM`,`HARD`) | NULL | Độ khó tương đối |
| `sort_order` | INT | NOT NULL, DEFAULT 0 | Thứ tự hiển thị trong deck |
| `search_vector` | TSVECTOR | GENERATED ALWAYS AS STORED | Full-text search (xem §2.3) |

> **Lý do thêm các field mới:**
> - `phonetic`: Hiển thị IPA bên dưới từ, hỗ trợ người học phát âm đúng
> - `image_url`: Học qua hình ảnh (visual learning) — tính năng core của Quizlet
> - `icon`: Gắn emoji/icon nhanh để nhận diện thẻ, thân thiện mobile
> - `audio_url`: TTS (Google/ElevenLabs) hoặc file người dùng tự upload
> - `part_of_speech`: Giúp hiểu ngữ pháp của từ

---

#### `user_card_review` — Trạng thái SRS mỗi user × card · *PK composite (không kế thừa)*
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `user_id` | UUID | FK → `users.id` | PK composite |
| `card_id` | UUID | FK → `cards.id` | PK composite |
| `deck_id` | UUID | FK → `decks.id`, NOT NULL | Denormalized — copy từ `cards.deck_id`; tránh JOIN khi lọc SRS theo deck |
| `ease_factor` | FLOAT | NOT NULL, DEFAULT 2.5 | SM-2 ease factor |
| `interval_days` | INT | NOT NULL, DEFAULT 0 | Số ngày đến lần ôn tiếp |
| `repetitions` | INT | NOT NULL, DEFAULT 0 | Số lần đã ôn thành công |
| `next_review_at` | TIMESTAMPTZ | NOT NULL | Ngày ôn tiếp theo |
| `last_rating` | ENUM(`AGAIN`,`HARD`,`GOOD`,`EASY`) | NULL | Đánh giá lần cuối |
| `is_starred` | BOOLEAN | NOT NULL, DEFAULT FALSE | User đánh dấu thẻ quan trọng |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Cập nhật thủ công |

---

#### `user_deck_progress` — Tiến độ user trên từng deck ⭐ MỚI · *PK composite (không kế thừa)*
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `user_id` | UUID | FK → `users.id` | PK composite |
| `deck_id` | UUID | FK → `decks.id` | PK composite |
| `total_cards` | INT | NOT NULL | |
| `learned_cards` | INT | NOT NULL, DEFAULT 0 | Số thẻ đã học ít nhất 1 lần |
| `mastered_cards` | INT | NOT NULL, DEFAULT 0 | Số thẻ đã thuộc (interval ≥ 21 ngày) |
| `last_studied_at` | TIMESTAMPTZ | NULL | |
| `is_copied_from` | UUID | NULL, FK → `decks.id` | Nếu đây là bản copy của deck khác |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Cập nhật thủ công |

**Đồng bộ `total_cards`:** Trigger `AFTER INSERT OR DELETE` trên `cards` cập nhật `user_deck_progress.total_cards` cho mọi user có progress trên deck đó (xem §2.3).

---

#### `quiz_questions` — Câu hỏi trắc nghiệm · *extends* `BaseEntity`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| *(id, created_at, updated_at)* | — | *kế thừa BaseEntity* | |
| `deck_id` | UUID | FK → `decks.id` | |
| `card_id` | UUID | FK → `cards.id`, NULL | Card gốc tạo ra câu hỏi |
| `question_type` | ENUM(`MULTIPLE_CHOICE`,`TRUE_FALSE`,`FILL_IN`) | NOT NULL | |
| `question_text` | TEXT | NOT NULL | |
| `correct_answer` | TEXT | NOT NULL | |
| `options` | JSONB | NULL | Các đáp án sai (MCQ) |

#### `quiz_attempts` — Lần làm quiz · *extends* `BaseEntity`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| *(id, created_at, updated_at)* | — | *kế thừa BaseEntity* | |
| `user_id` | UUID | FK → `users.id` | |
| `deck_id` | UUID | FK → `decks.id` | |
| `score` | FLOAT | NULL | % điểm đúng (0.0 – 1.0) |
| `total_questions` | INT | NOT NULL | |
| `correct_answers` | INT | NOT NULL, DEFAULT 0 | |
| `xp_earned` | INT | NOT NULL, DEFAULT 0 | |
| `time_taken_seconds` | INT | NULL | Thời gian làm bài |
| `started_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |
| `finished_at` | TIMESTAMPTZ | NULL | |

#### `quiz_answers` — Đáp án từng câu · *extends* `BaseEntity`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| *(id, created_at, updated_at)* | — | *kế thừa BaseEntity* | |
| `attempt_id` | UUID | FK → `quiz_attempts.id` | |
| `question_id` | UUID | FK → `quiz_questions.id` | |
| `selected_answer` | TEXT | NULL | |
| `is_correct` | BOOLEAN | NOT NULL | |
| `answered_at` | TIMESTAMPTZ | NULL | |

---

#### `daily_activity` — Hoạt động học theo ngày
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `user_id` | UUID | FK → `users.id` | PK composite |
| `activity_date` | DATE | NOT NULL | PK composite |
| `cards_reviewed` | INT | NOT NULL, DEFAULT 0 | |
| `quiz_taken` | INT | NOT NULL, DEFAULT 0 | Số bài quiz đã làm |
| `xp_earned` | INT | NOT NULL, DEFAULT 0 | |
| `study_minutes` | INT | NOT NULL, DEFAULT 0 | Phút học ước tính |

#### `async_jobs` — Trạng thái tác vụ nền · *extends* `BaseEntity`
| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| *(id, created_at, updated_at)* | — | *kế thừa BaseEntity* | |
| `type` | ENUM(`AI_GENERATE`,`FILE_IMPORT`) | NOT NULL | |
| `status` | ENUM(`PENDING`,`PROCESSING`,`DONE`,`FAILED`) | NOT NULL | |
| `user_id` | UUID | FK → `users.id` | |
| `result` | JSONB | NULL | Kết quả hoặc thông tin lỗi |

### 2.3 Index, Full-Text Search & Triggers

#### Indexes

```sql
-- Deck listing & library
CREATE INDEX idx_decks_owner ON decks(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_decks_public ON decks(is_public, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_deck_topics_topic ON deck_topics(topic_id, deck_id);
CREATE INDEX idx_deck_tags_user ON deck_tags(user_id, deck_id);

-- Cards trong deck (sort_order)
CREATE INDEX idx_cards_deck_id ON cards(deck_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cards_deck_sort
  ON cards(deck_id, sort_order)
  WHERE deleted_at IS NULL;

-- SRS: thẻ đến hạn (GET /review/due)
CREATE INDEX idx_ucr_user_due
  ON user_card_review(user_id, next_review_at);
CREATE INDEX idx_ucr_user_deck_due
  ON user_card_review(user_id, deck_id, next_review_at);
CREATE INDEX idx_ucr_user_starred
  ON user_card_review(user_id)
  WHERE is_starred = TRUE;

-- Progress / library page
CREATE INDEX idx_udp_user_studied
  ON user_deck_progress(user_id, last_studied_at DESC NULLS LAST);

-- Leaderboard (cache miss fallback)
CREATE INDEX idx_users_xp_leaderboard
  ON users(xp DESC, id)
  WHERE is_active = TRUE;

-- Streak scheduler (chỉ quét user bỏ học)
CREATE INDEX idx_users_last_study ON users(last_study_date) WHERE is_active = TRUE;

-- Heatmap
CREATE INDEX idx_daily_activity_user_date ON daily_activity(user_id, activity_date DESC);

-- Quiz
CREATE INDEX idx_quiz_questions_deck ON quiz_questions(deck_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id, started_at DESC);
CREATE INDEX idx_quiz_attempts_deck ON quiz_attempts(deck_id);
CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(attempt_id);

-- Async jobs: user poll & cleanup
CREATE INDEX idx_async_jobs_user_status ON async_jobs(user_id, status, created_at DESC);
```

#### Full-Text Search (generated column)

Dùng config `'simple'` (không stem) — phù hợp nội dung song ngữ en/vi:

```sql
-- decks.search_vector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description, '')), 'B')
) STORED;

-- cards.search_vector
GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', coalesce(front, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(back, '')), 'B')
) STORED;

CREATE INDEX idx_decks_fts ON decks USING gin(search_vector);
CREATE INDEX idx_cards_fts ON cards USING gin(search_vector);
```

Query: `WHERE search_vector @@ plainto_tsquery('simple', :q)`

**Quy tắc app cho `user_card_review.deck_id`:** Gán khi tạo review (copy deck, first review, import). Cập nhật đồng bộ nếu card chuyển deck.

#### Trigger đồng bộ `total_cards`

```sql
CREATE OR REPLACE FUNCTION sync_deck_total_cards()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_deck_progress
    SET total_cards = total_cards + 1, updated_at = NOW()
    WHERE deck_id = NEW.deck_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_deck_progress
    SET total_cards = GREATEST(total_cards - 1, 0), updated_at = NOW()
    WHERE deck_id = OLD.deck_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cards_sync_total
  AFTER INSERT OR DELETE ON cards
  FOR EACH ROW EXECUTE FUNCTION sync_deck_total_cards();
```

---

## 3. Phân quyền RBAC

| Quyền | USER | ADMIN |
| ----------------------------| ------| -------|
| Xem deck công khai | ✅ | ✅ |
| Tạo/sửa/xóa deck riêng tư | ✅ | ✅ |
| Copy deck công khai về | ✅ | ✅ |
| Học flashcard, làm quiz | ✅ | ✅ |
| Đánh dấu thẻ (starred) | ✅ | ✅ |
| Xem tiến độ cá nhân | ✅ | ✅ |
| Xem leaderboard | ✅ | ✅ |
| Import file CSV/Excel | ✅ | ✅ |
| Generate deck bằng AI | ✅ | ✅ |
| Tạo/sửa/xóa tag cá nhân (deck_tags) | ✅ (deck của mình) | ✅ |
| Chọn topic hệ thống khi tạo deck | ✅ | ✅ |
| Tạo/sửa/xóa deck công khai | ❌ | ✅ |
| Quản lý topics hệ thống | ❌ | ✅ |
| Quản lý user (ban/unban) | ❌ | ✅ |
| Xem thống kê toàn hệ thống | ❌ | ✅ |

---

## 4. API Backend — Nhóm endpoint

### Auth
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/auth/register` | Đăng ký tài khoản |
| POST | `/api/v1/auth/login` | Đăng nhập, nhận access + refresh token |
| POST | `/api/v1/auth/refresh` | Đổi refresh token lấy access token mới |
| POST | `/api/v1/auth/logout` | Xóa refresh token khỏi Redis |
| GET | `/api/v1/auth/me` | Thông tin user hiện tại |

### Topics (Chủ đề) ⭐ MỚI
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/topics` | Danh sách tất cả topics (public) |
| POST | `/api/v1/topics` | Tạo topic mới (ADMIN only) |
| PUT | `/api/v1/topics/{id}` | Cập nhật topic (ADMIN only) |
| DELETE | `/api/v1/topics/{id}` | Xóa topic (ADMIN only) |

### Deck & Card
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/decks` | Danh sách deck (phân trang, lọc theo topic/keyword) |
| POST | `/api/v1/decks` | Tạo deck mới (thủ công) |
| GET | `/api/v1/decks/{id}` | Chi tiết deck + metadata |
| PUT | `/api/v1/decks/{id}` | Cập nhật deck |
| DELETE | `/api/v1/decks/{id}` | Xóa deck (soft delete) |
| POST | `/api/v1/decks/{id}/copy` | Copy deck về thư viện cá nhân |
| GET | `/api/v1/decks/{id}/cards` | Danh sách card trong deck |
| POST | `/api/v1/decks/{id}/cards` | Thêm card thủ công |
| PUT | `/api/v1/decks/{deckId}/cards/{cardId}` | Sửa card |
| DELETE | `/api/v1/decks/{deckId}/cards/{cardId}` | Xóa card (soft delete) |
| POST | `/api/v1/decks/import` | Import deck từ file CSV/Excel/DOCX |
| POST | `/api/v1/decks/generate` | Generate deck bằng AI (trả jobId) |
| GET | `/api/v1/jobs/{jobId}` | Poll trạng thái tác vụ nền |

### Deck Tags (Nhãn cá nhân)
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/decks/{id}/tags` | Lấy tất cả tag của deck (của user hiện tại) |
| PUT | `/api/v1/decks/{id}/tags` | Cập nhật tags (truyền array tag_name mới) |
| DELETE | `/api/v1/decks/{id}/tags/{tagName}` | Xóa 1 tag cụ thể |

### SRS Review
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/review/due` | Lấy danh sách thẻ đến hạn ôn (`?deckId=`) |
| POST | `/api/v1/review/{cardId}/rate` | Gửi đánh giá: AGAIN / HARD / GOOD / EASY |
| POST | `/api/v1/review/{cardId}/star` | Đánh dấu thẻ quan trọng ⭐ MỚI |

### Quiz
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/quiz/start` | Tạo session quiz cho deck |
| GET | `/api/v1/quiz/{attemptId}/questions` | Lấy câu hỏi |
| POST | `/api/v1/quiz/{attemptId}/submit` | Nộp đáp án toàn bài |
| GET | `/api/v1/quiz/{attemptId}/result` | Xem kết quả |

### Progress & Leaderboard
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/progress/heatmap` | Hoạt động học theo ngày trong năm |
| GET | `/api/v1/progress/streak` | Streak hiện tại của user |
| GET | `/api/v1/progress/stats` | Tổng quan: tổng thẻ đã học, quiz đã làm, XP ⭐ MỚI |
| GET | `/api/v1/leaderboard` | Top 50 người học (cache Redis 60s) |

### Media Upload ⭐ MỚI
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/media/upload` | Upload ảnh cho card (trả về `image_url`) |

### Admin
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/admin/users` | Danh sách user (phân trang) |
| PUT | `/api/v1/admin/users/{id}/status` | Khoá/mở tài khoản |
| GET | `/api/v1/admin/decks/popular` | Deck phổ biến nhất |
| GET | `/api/v1/admin/stats` | Thống kê tổng quan hệ thống |

---

## 5. Tính năng Import & AI Generate

### Import file
| Định dạng | Thư viện | Header yêu cầu | Mức ưu tiên |
|---|---|---|---|
| CSV | OpenCSV | `front, back, phonetic, example, hint, image_url, icon` | Làm trước |
| Excel (.xlsx) | Apache POI | Sheet 1, hàng 1 là header | Làm sau CSV |
| DOCX | Apache POI XWPF | Bảng Word: cột front / back / example | Tùy chọn |

**Response sau import:**
```json
{
  "deckId": "uuid",
  "totalImported": 18,
  "totalSkipped": 2,
  "skippedRows": [
    { "row": 5, "reason": "Thiếu cột back" }
  ]
}
```

### AI Generate (Claude / OpenAI API)
- Endpoint: `POST /api/v1/decks/generate` → trả `{ jobId }`
- Frontend poll `GET /api/v1/jobs/{jobId}` mỗi 2 giây
- Khi `status = DONE` → chuyển vào trang deck vừa tạo
- AI tạo ra cả `phonetic`, `example`, `part_of_speech` cho từng card
- User nhập: chủ đề + số lượng từ + ngôn ngữ dịch
- Prompt template cố định phía backend

---

## 6. Redis — Các Key sử dụng

| Mục đích | Key pattern | TTL | Lý do |
|---|---|---|---|
| Refresh Token | `refresh_token:{userId}` | 7 ngày | Revoke ngay khi logout |
| Leaderboard cache | `leaderboard:top50` | 60 giây | Tránh query nặng |
| Job status | `job:{jobId}` | 30 phút | Frontend poll không tốn DB query |
| Topics cache | `topics:all` | 10 phút | Danh sách topic ít thay đổi |

---

## 7. Kiến trúc Async — Chuẩn bị cho tương lai

```
Controller → TaskDispatcher (interface)
                ├── SpringAsyncDispatcher (@Async) ← hiện tại
                └── RabbitMQDispatcher             ← nâng cấp sau, chỉ swap bean
```

Khi nâng cấp lên RabbitMQ: viết thêm `RabbitMQDispatcher implements TaskDispatcher`, đổi `@Bean` inject — Controller và Service không đụng vào.

---

## 8. Cấu trúc thư mục project

```
lumotus/
├── backend/                                    # Spring Boot 4 ✅ ĐÃ KHỞI TẠO
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/backend/lumotus/       # groupId: com.backend · artifactId: lumotus
│   │   │   │   ├── config/                     # JpaConfig, SecurityConfig, RedisConfig, AsyncConfig
│   │   │   │   ├── controller/                 # REST Controllers (@RestController)
│   │   │   │   ├── service/                    # Business logic (@Service)
│   │   │   │   ├── repository/                 # JPA Repositories (JpaRepository)
│   │   │   │   ├── entity/
│   │   │   │   │   ├── common/                 # BaseEntity.java, SoftDeleteEntity.java
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Deck.java
│   │   │   │   │   ├── Card.java
│   │   │   │   │   ├── Topic.java
│   │   │   │   │   ├── UserCardReview.java
│   │   │   │   │   ├── QuizAttempt.java
│   │   │   │   │   └── AsyncJob.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── request/                # LoginRequest, CreateDeckRequest...
│   │   │   │   │   └── response/               # UserResponse, DeckResponse...
│   │   │   │   ├── mapper/                     # MapStruct mappers
│   │   │   │   ├── exception/                  # Custom exceptions + @ControllerAdvice
│   │   │   │   ├── security/                   # JwtFilter, UserDetailsServiceImpl
│   │   │   │   ├── async/                      # TaskDispatcher + SpringAsyncDispatcher
│   │   │   │   ├── scheduler/                  # DailyStreakScheduler (@Scheduled)
│   │   │   │   └── LumotusApplication.java     # @SpringBootApplication entry point
│   │   │   └── resources/
│   │   │       ├── db/migration/               # V1__init.sql, V2__topics.sql... (Flyway)
│   │   │       └── application.yaml            # ✅ Cấu hình đầy đủ với env variables
│   │   └── test/java/com/backend/lumotus/      # JUnit + MockMvc test cases
│   ├── .gitignore                              # ✅ target/, logs/, .env, IDE files
│   ├── Dockerfile                              # ✅ Multi-stage: Maven build → JRE 21 Alpine
│   └── pom.xml                                 # ✅ Đầy đủ: Security, JWT, Flyway, Redis, MapStruct...
│
├── frontend/                                   # React 18 + Vite + TypeScript ✅ ĐÃ KHỞI TẠO
│   ├── src/
│   │   ├── api/                                # axiosClient.ts + file gọi API theo module
│   │   ├── assets/                             # Ảnh, icon static
│   │   ├── components/
│   │   │   ├── layout/                         # MainLayout, AuthLayout, Navbar, Sidebar
│   │   │   └── ui/                             # Button, Card, Modal, Badge, Input (shared)
│   │   ├── hooks/                              # useAuth, useDeck, useReview...
│   │   ├── pages/
│   │   │   ├── auth/                           # LoginPage.tsx, RegisterPage.tsx
│   │   │   ├── admin/                          # AdminPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ExplorePage.tsx
│   │   │   ├── DeckDetailPage.tsx
│   │   │   ├── ReviewPage.tsx
│   │   │   ├── QuizPage.tsx
│   │   │   ├── ProgressPage.tsx
│   │   │   └── LeaderboardPage.tsx
│   │   ├── store/                              # authStore.ts, uiStore.ts (Zustand)
│   │   ├── types/                              # TypeScript interfaces (User, Deck, Card...)
│   │   ├── utils/                              # formatDate, cn, validators...
│   │   ├── vite-env.d.ts                       # ✅ Vite client types (import.meta.env)
│   │   ├── App.tsx                             # Router + PrivateRoute + AdminRoute
│   │   ├── main.tsx                            # Entry: React root + BrowserRouter + QueryClient
│   │   └── index.css                           # Tailwind v4 + CSS custom properties
│   ├── .gitignore                              # ✅ node_modules/, dist/, .env, .vite/
│   ├── index.html                              # id="root", Inter font, meta SEO
│   ├── vite.config.ts                          # ✅ react() + tailwindcss() + proxy /api→:8080
│   ├── tsconfig.json                           # ✅ strict, moduleDetection: force, @/* alias
│   ├── tsconfig.node.json                      # config cho vite.config.ts
│   └── package.json                            # react 18, RQ v5, zustand, framer-motion...
│
├── docker-compose.yml                          # ✅ Dev: PostgreSQL 17 + Redis 7 + pgAdmin
├── docker-compose.prod.yml                     # Prod: tất cả services (chưa tạo)
├── .env.example                                # ✅ Template đầy đủ biến môi trường
└── .gitignore                                  # Root gitignore (chưa tạo)
```

---

## 9. Lộ trình phát triển 6 giai đoạn

### Giai đoạn 1 — Môi trường dev chuẩn
- [ ] Docker Compose local: PostgreSQL + Redis + pgAdmin
- [ ] Cấu trúc biến môi trường `.env` + `.env.example`
- [ ] Git branching: `main` / `develop` / `feature/*`
- [ ] Khởi tạo project Spring Boot 3.x + React 18 + Vite
- [ ] Cấu trúc thư mục theo sơ đồ trên

### Giai đoạn 2 — Xây dựng Backend
- [ ] Schema DB đầy đủ (bao gồm `topics`, fields mới cho `cards`, `deck_id` trên `user_card_review`, `search_vector`, triggers) + Flyway migration
- [ ] Auth: đăng ký, đăng nhập, JWT, refresh token Redis
- [ ] RBAC: USER / ADMIN
- [ ] CRUD Topics (Admin)
- [ ] CRUD Deck & Card (bao gồm phonetic, image_url, icon, audio_url)
- [ ] Copy Deck về thư viện cá nhân
- [ ] Import file: CSV → Excel → DOCX (header mới có phonetic, image_url)
- [ ] Media upload: nhận file ảnh → lưu storage → trả URL
- [ ] SRS Review: lấy thẻ đến hạn, gửi rating, tính SM-2 interval
- [ ] Starred card
- [ ] Quiz: tạo session, nộp bài, tính điểm, award XP
- [ ] AI Generate: gọi AI API (sinh phonetic + example), lưu job status
- [ ] Progress: heatmap, streak, stats tổng quan, `@Scheduled` reset 00:00
- [ ] Leaderboard với Redis cache
- [ ] Xử lý lỗi tập trung `@ControllerAdvice`
- [ ] Swagger/OpenAPI docs

**Ghi chú hiệu năng (Giai đoạn 2):**

| Mục | Khuyến nghị |
|---|---|
| HikariCP | `maximum-pool-size: 10`, `minimum-idle: 2` (VPS 2GB RAM) |
| Pagination cards | `GET /decks/{id}/cards` bắt buộc `page`/`size` (default 50) — deck lớn tránh load all |
| SRS rate | Một `@Transactional` gom update `user_card_review` + `daily_activity` + `users.xp` + `user_deck_progress` |
| Streak scheduler | Đổi quét tất cả user → `WHERE last_study_date < CURRENT_DATE - 1` (dùng index `idx_users_last_study`) |
| Leaderboard Redis | `ZADD leaderboard {xp} {userId}` — sorted set thay vì serialize JSON top 50; `ZREVRANGE` khi cache miss |
| Card list API | Projection DTO — không SELECT `generation_prompt`, full TEXT khi chỉ cần preview |

### Giai đoạn 3 — Xây dựng Frontend
- [ ] Cấu hình Axios interceptor: gắn JWT, silent refresh
- [ ] React Router: route bảo vệ theo role
- [ ] Trang Auth: Login, Register
- [ ] Trang Khám phá: browse deck công khai theo topic, tìm kiếm full-text
- [ ] Trang chi tiết Deck: danh sách card có ảnh + phiên âm + icon
- [ ] Thư viện cá nhân: deck của tôi, deck đã copy, tiến độ từng deck
- [ ] Flashcard Review: flip 3D animation (Framer Motion), nút Again/Hard/Good/Easy, hiển thị phonetic + ảnh + audio
- [ ] Starred review mode: chỉ ôn thẻ đã đánh dấu
- [ ] Quiz: timer đếm ngược, MCQ / True-False, nộp bài, xem điểm
- [ ] Trang Progress: heatmap streak calendar (GitHub-style), biểu đồ Chart.js, stats
- [ ] Leaderboard: bảng xếp hạng avatar + điểm XP
- [ ] Import file UI: upload, loading, hiển thị report kết quả
- [ ] AI Generate UI: form chủ đề + số từ, polling progress
- [ ] Admin: quản lý topic, deck, user, thống kê
- [ ] Responsive: desktop + tablet + mobile

### Giai đoạn 4 — Kiểm thử và đóng gói
- [ ] JUnit + MockMvc: tối thiểu 10 test case chính (Auth, Deck, Card, SRS, Quiz)
- [ ] Dockerfile BE: multi-stage build (Maven → JRE 21)
- [ ] Dockerfile FE: build React → Nginx serve static
- [ ] `docker-compose.yml` (dev) + `docker-compose.prod.yml` (production)
- [ ] README: hướng dẫn cài đặt, biến môi trường, chạy local và production

### Giai đoạn 5 — Deploy lên VPS
- [ ] Mua VPS: tối thiểu 2 vCPU · 2GB RAM · 20GB SSD (~$12/tháng DigitalOcean)
- [ ] Mua domain hoặc dùng subdomain miễn phí để demo
- [ ] Cài Ubuntu + Docker + Docker Compose trên VPS
- [ ] Cấu hình Nginx: reverse proxy API, serve FE static, SSL termination
- [ ] Let's Encrypt + Certbot: cấp và tự gia hạn HTTPS
- [ ] Cấu hình GitHub Actions CI/CD:
  - Push lên `main` → chạy test → build image → push Docker Hub → SSH VPS → `docker compose up -d`
- [ ] Lưu secrets: SSH key, Docker Hub token, API key AI vào GitHub Secrets
- [ ] Thêm swap 2GB trên VPS để tránh OOM

### Giai đoạn 6 — Vận hành
- [ ] Spring Boot Actuator: expose `/actuator/health`
- [ ] UptimeRobot: ping health endpoint mỗi 5 phút, cảnh báo Telegram/email nếu chết
- [ ] Logging: ghi ra file, rotate hàng ngày (Logback)
- [ ] Backup PostgreSQL: cron `pg_dump` hàng đêm, lưu `.sql.gz` trên VPS
- [ ] `restart: unless-stopped` trong Docker Compose để auto restart khi crash

---

## 10. Rủi ro và cách xử lý

| Rủi ro | Xác suất | Cách phòng ngừa |
|---|---|---|
| App crash không tự restart | Cao | `restart: unless-stopped` trong Compose |
| Hết RAM trên VPS | Trung bình | Thêm 2GB swap file trên Ubuntu |
| API key AI bị lộ | Cao nếu sơ ý | Chỉ lưu trong GitHub Secrets và `.env` VPS |
| Mất dữ liệu DB | Thấp nhưng thảm | pg_dump cron hàng đêm |
| Deploy xong app không lên | Trung bình | Test trên staging branch trước |
| Flyway migration conflict | Trung bình | Không bao giờ sửa file migration đã chạy |
| Refresh token bị lộ | Thấp | Lưu Redis, revoke ngay khi logout |
| File ảnh upload quá lớn | Trung bình | Giới hạn 5MB, validate MIME type server-side |
| Full-text search chậm | Thấp | GIN index trên PostgreSQL là đủ cho ~100 user |

---

## 11. Tiêu chí đánh giá và tỷ trọng

| Tiêu chí | Tỷ trọng | Ghi chú |
|---|---|---|
| Giao diện Frontend | 20% | UI đẹp, animation mượt, tích hợp đầy đủ API |
| Bảo mật và phân quyền | 15% | JWT, refresh token, RBAC đúng phạm vi |
| Chất lượng API Backend | 15% | Endpoint rõ, phân trang, lọc, xử lý lỗi |
| Phân tích nghiệp vụ | 10% | Hiểu đúng bài toán, actor, luồng |
| Thiết kế dữ liệu | 10% | Schema chuẩn hóa, quan hệ chặt |
| Trải nghiệm người dùng | 10% | Loading state, thông báo lỗi, validation |
| Kiểm thử và tài liệu | 10% | Test API, Swagger, README đầy đủ |
| Hoàn thiện kỹ thuật | 10% | Logging, migration, deploy ổn định |

---

## 12. Stack phụ thuộc — Dependencies chính

### Backend (`pom.xml`)
```xml
spring-boot-starter-webmvc
spring-boot-starter-security
spring-boot-starter-data-jpa
spring-boot-starter-data-redis
spring-boot-starter-validation
spring-boot-starter-actuator
postgresql
flyway-core + flyway-database-postgresql
jjwt-api + jjwt-impl + jjwt-jackson          <!-- JWT 0.12.x -->
opencsv
apache-poi-ooxml                              <!-- Excel + DOCX -->
springdoc-openapi-starter-webmvc-ui           <!-- Swagger UI -->
cloudinary-http44                             <!-- Media upload lên Cloudinary -->
mapstruct + mapstruct-processor + lombok
```

### Frontend (`package.json`)
```
react + react-dom
typescript
vite
tailwindcss + @tailwindcss/vite
react-router-dom v6
@tanstack/react-query v5
axios
framer-motion
react-hook-form + zod           <!-- Form validation -->
chart.js + react-chartjs-2
zustand                         <!-- Lightweight state management -->
lucide-react                    <!-- Icon library -->
react-hot-toast                 <!-- Notifications -->
```

---

## 13. Biến môi trường (`.env.example`)

> Xem file `.env.example` tại root project để biết đầy đủ. Dưới đây là tóm tắt các nhóm biến chính:

```env
# ── PostgreSQL ───────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lumotus
DB_USER=lumotus_user
DB_PASSWORD=changeme

# ── Redis ────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379

# ── JWT ──────────────────────────────────────────
JWT_SECRET=change-this-to-a-256-bit-random-string
JWT_ACCESS_EXPIRY_MS=900000      # 15 phút
JWT_REFRESH_EXPIRY_DAYS=7

# ── Cloudinary (Media Storage) ───────────────────
# Đăng ký miễn phí tại: https://cloudinary.com
# Free tier: 25 GB storage + 25 GB bandwidth/tháng
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ── AI API ───────────────────────────────────────
AI_PROVIDER=openai               # openai | claude
OPENAI_API_KEY=sk-...
# CLAUDE_API_KEY=sk-ant-...

# ── App ──────────────────────────────────────────
SERVER_PORT=8080
APP_BASE_URL=http://localhost:8080
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## 14. Media Storage — Cloudinary

> **Lựa chọn:** Cloudinary thay vì AWS S3 hay local disk

### Lý do chọn Cloudinary
| Tiêu chí | Cloudinary | AWS S3 | Local disk |
|---|---|---|---|
| **Free tier** | 25GB + 25GB BW/tháng | 5GB / 12 tháng | Không giới hạn |
| **CDN** | ✅ Tự động | ⚠️ Cần CloudFront thêm | ❌ Không có |
| **Transform ảnh** | ✅ URL magic (`w_300,c_fill`) | ❌ | ❌ |
| **Độ phức tạp** | Thấp (SDK đơn giản) | Cao (IAM, policy, bucket) | Thấp nhưng không scale |
| **Phù hợp quy mô** | ~10–10.000 user | Enterprise | Dev only |

### Tích hợp Spring Boot
```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.cloudinary</groupId>
    <artifactId>cloudinary-http44</artifactId>
    <version>1.39.0</version>
</dependency>
```

```yaml
# application.yaml
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME}
  api-key: ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}
```

### Upload flow
```
Frontend → POST /api/v1/media/upload (multipart)
    → Backend validate (MIME, size ≤ 5MB)
    → Cloudinary.uploader().upload(file)
    → Trả về { url: "https://res.cloudinary.com/..." }
    → Lưu URL vào cột image_url của cards
```

### Folder structure trên Cloudinary
```
lumotus/
├── cards/          # Ảnh minh hoạ thẻ từ
├── decks/          # Ảnh bìa deck
└── avatars/        # Ảnh đại diện user
```

---

*Tài liệu được cập nhật lần cuối: 2026-06-06 · Lumotus — Fullstack FlashCard English · Spring Boot 4 + React 18*
