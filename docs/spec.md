# 📋 Technical Specification — Lumotus

Tài liệu đặc tả kỹ thuật hệ thống **Lumotus** (Smart Flashcard English Learning Application).

---

## 1. Kiến trúc hệ thống (System Architecture)

Hệ thống Lumotus được thiết kế theo mô hình **Client-Server** truyền thống, trong đó:
- **Frontend**: Single Page Application (SPA) xây dựng bằng React 18, TypeScript, và Vite. Tương tác với Backend hoàn toàn qua RESTful APIs.
- **Backend**: Ứng dụng monolithic viết bằng Spring Boot 4 (Java 21), sử dụng Spring Security để quản lý phân quyền và xác thực.
- **Database (Primary)**: PostgreSQL 17 lưu trữ toàn bộ dữ liệu quan hệ có cấu trúc với ràng buộc toàn vẹn.
- **Cache & Session Store**: Redis 7 lưu trữ danh sách blacklisted/refresh tokens, cache bảng xếp hạng (leaderboard) và trạng thái các async job.
- **File Storage**: Cloudinary (Cloud Media Storage) lưu trữ tệp tin đa phương tiện (ảnh minh họa thẻ, âm thanh phát âm).

```
 ┌────────────────────────────────────────────────────────┐
 │                      Client Layer                      │
 │                  React 18 + TS (Vite)                  │
 └──────────────────────────┬─────────────────────────────┘
                            │ HTTPS (REST API)
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │                      Nginx Proxy                       │
 └──────────────────────────┬─────────────────────────────┘
                            │ Proxy Pass
                            ▼
 ┌────────────────────────────────────────────────────────┐
 │               Backend: Spring Boot 4                   │
 └──────┬───────────────────┬──────────────────────┬──────┘
        │ JPA / JDBC        │ Redis Command        │ Cloudinary SDK
        ▼                   ▼                      ▼
 ┌──────────────┐    ┌──────────────┐      ┌──────────────┐
 │ PostgreSQL 17│    │   Redis 7    │      │  Cloudinary  │
 │ (Dữ liệu)    │    │ (Cache/Token)│      │  (Hình ảnh)  │
 └──────────────┘    └──────────────┘      └──────────────┘
```

---

## 2. Thiết kế Cơ sở dữ liệu (Database Schema Spec)

Toàn bộ các bảng (tables) sử dụng UUID v4 làm khóa chính (`id`) trừ các bảng liên kết (n-n) sử dụng khóa chính hỗn hợp (Composite Primary Key).

### 2.1. Lớp thực thể cha (Base Entities)
Các thực thể trong Java được ánh xạ từ hai lớp cha `@MappedSuperclass`:
- **`BaseEntity`**: Chứa `id` (UUID), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **`SoftDeleteEntity`** (kế thừa `BaseEntity`): Thêm `deleted_at` (TIMESTAMPTZ) phục vụ việc xóa mềm (soft-delete).

---

### 2.2. Chi tiết các bảng dữ liệu

#### 1. Bảng `users` (Kế thừa `BaseEntity`)
Lưu trữ thông tin người dùng và số liệu thống kê gamification.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | Sinh tự động bằng UUID v4 |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Tên đăng nhập |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Địa chỉ email |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu băm bằng BCrypt |
| `avatar_url` | TEXT | NULL | Đường dẫn ảnh đại diện |
| `role` | VARCHAR(20) | NOT NULL | Vai trò: `USER`, `ADMIN` |
| `xp` | INT | NOT NULL, DEFAULT 0 | Tổng điểm kinh nghiệm tích lũy |
| `streak` | INT | NOT NULL, DEFAULT 0 | Chuỗi ngày học liên tiếp |
| `last_study_date` | DATE | NULL | Ngày gần nhất học thẻ để tính streak |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Trạng thái kích hoạt tài khoản |
| `oauth_provider` | VARCHAR(20) | NULL | `GOOGLE` khi đăng nhập OAuth |
| `oauth_subject` | VARCHAR(255) | NULL | Subject ID từ Google (`sub`) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thời gian tạo tài khoản |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thời gian cập nhật gần nhất |

---

#### 2. Bảng `topics` (Kế thừa `BaseEntity`)
Các chủ đề hệ thống phục vụ mục đích phân loại và tìm kiếm công khai (do Admin quản lý).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | Tên chủ đề (Ví dụ: "IELTS", "Travel") |
| `slug` | VARCHAR(120) | UNIQUE, NOT NULL | Slug thân thiện URL (Ví dụ: `ielts`, `travel`) |
| `description` | TEXT | NULL | Mô tả chi tiết chủ đề |
| `icon` | VARCHAR(100) | NULL | Tên emoji hoặc Lucide Icon |
| `color_hex` | CHAR(7) | NULL | Mã màu hex đại diện (Ví dụ: `#4F46E5`) |
| `sort_order` | INT | NOT NULL, DEFAULT 0 | Thứ tự hiển thị trên Explore Page |

---

#### 3. Bảng `decks` (Kế thừa `SoftDeleteEntity`)
Một bộ thẻ (Deck) chứa danh sách các thẻ từ vựng.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `slug` | VARCHAR(120) | NOT NULL | URL-friendly; unique theo `(owner_id, slug)` khi chưa xóa mềm |
| `title` | VARCHAR(200) | NOT NULL | Tiêu đề bộ thẻ |
| `description` | TEXT | NULL | Mô tả nội dung bộ thẻ |
| `cover_image_url`| TEXT | NULL | Ảnh bìa đại diện bộ thẻ |
| `owner_id` | UUID | FK -> `users.id`, NOT NULL | Người sở hữu bộ thẻ |
| `owner_type` | VARCHAR(20) | NOT NULL | `USER` hoặc `ADMIN` |
| `is_public` | BOOLEAN | NOT NULL, DEFAULT FALSE | Trạng thái hiển thị công khai |
| `is_copyable` | BOOLEAN | NOT NULL, DEFAULT TRUE | Cho phép người khác sao chép bộ thẻ |
| `language_front` | VARCHAR(10) | NOT NULL, DEFAULT 'en' | Ngôn ngữ mặt trước (mặc định tiếng Anh) |
| `language_back` | VARCHAR(10) | NOT NULL, DEFAULT 'vi' | Ngôn ngữ mặt sau (mặc định tiếng Việt) |
| `generated_by_ai` | BOOLEAN | NOT NULL, DEFAULT FALSE | Đánh dấu bộ thẻ tạo bởi AI |
| `generation_prompt`| TEXT | NULL | Prompt dùng để gen bộ thẻ (nếu có) |
| `view_count` | INT | NOT NULL, DEFAULT 0 | Số lượt xem bộ thẻ |
| `copy_count` | INT | NOT NULL, DEFAULT 0 | Số lượt được copy |
| `source_deck_id` | UUID | FK -> `decks.id`, NULL | Deck gốc nếu bản này copy từ Khám phá |
| `search_vector` | TSVECTOR | GENERATED ALWAYS AS STORED | Cột sinh tự động phục vụ full-text search (xem §2.3) |
| `deleted_at` | TIMESTAMPTZ | NULL | Thời gian xóa mềm (nếu NULL = chưa xóa) |

---

#### 4. Bảng `deck_topics` (Composite Key)
Bảng trung gian thể hiện mối quan hệ Nhiều-Nhiều (Many-to-Many) giữa `decks` công khai và `topics` hệ thống.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `deck_id` | UUID | FK -> `decks.id`, NOT NULL | Một phần của PRIMARY KEY |
| `topic_id` | UUID | FK -> `topics.id`, NOT NULL | Một phần của PRIMARY KEY |
| `assigned_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thời điểm liên kết |

---

#### 5. Bảng `deck_tags` (Composite Key)
Nhãn cá nhân do người dùng tự gắn cho deck để tiện quản lý (tương tự hashtag cá nhân).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `deck_id` | UUID | FK -> `decks.id`, NOT NULL | Một phần của PRIMARY KEY |
| `user_id` | UUID | FK -> `users.id`, NOT NULL | Một phần của PRIMARY KEY |
| `tag_name` | VARCHAR(50) | NOT NULL | Một phần của PRIMARY KEY (chữ thường, không khoảng trống) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thời gian gắn tag |

---

#### 6. Bảng `cards` (Kế thừa `SoftDeleteEntity`)
Thông tin thẻ học từ vựng chi tiết.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `deck_id` | UUID | FK -> `decks.id`, NOT NULL | Thuộc bộ thẻ nào |
| `front` | TEXT | NOT NULL | Nội dung mặt trước (Từ/câu hỏi) |
| `back` | TEXT | NOT NULL | Nội dung mặt sau (Nghĩa/đáp án) |
| `phonetic` | VARCHAR(200) | NULL | Phiên âm IPA (Ví dụ: `/æmˈbɪɡjuəs/`) |
| `part_of_speech` | VARCHAR(50) | NULL | Từ loại (Ví dụ: `noun`, `verb`, `adjective`) |
| `hint` | TEXT | NULL | Gợi ý khi học |
| `example` | TEXT | NULL | Ví dụ đặt câu |
| `image_url` | TEXT | NULL | Ảnh minh họa từ Cloudinary |
| `icon` | VARCHAR(100) | NULL | Emoji hoặc tên Lucide Icon |
| `audio_url` | TEXT | NULL | Đường dẫn file phát âm (TTS hoặc tự upload) |
| `difficulty` | VARCHAR(20) | NULL | Độ khó ước tính: `EASY`, `MEDIUM`, `HARD` |
| `sort_order` | INT | NOT NULL, DEFAULT 0 | Thứ tự sắp xếp trong bộ thẻ |
| `search_vector` | TSVECTOR | GENERATED ALWAYS AS STORED | Cột sinh tự động phục vụ full-text search (xem §2.3) |
| `deleted_at` | TIMESTAMPTZ | NULL | Thời điểm xóa mềm |

---

#### 7. Bảng `user_card_review` (Composite Key)
Theo dõi trạng thái và lịch sử ôn tập của từng User đối với từng Card theo phương pháp SRS (thuật toán SM-2).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | FK -> `users.id`, NOT NULL | Một phần của PRIMARY KEY |
| `card_id` | UUID | FK -> `cards.id`, NOT NULL | Một phần của PRIMARY KEY |
| `deck_id` | UUID | FK -> `decks.id`, NOT NULL | Denormalized — copy từ `cards.deck_id` khi tạo review; tránh JOIN khi lọc SRS theo deck |
| `ease_factor` | FLOAT | NOT NULL, DEFAULT 2.5 | Hệ số dễ (Ease Factor) của SM-2 |
| `interval_days` | INT | NOT NULL, DEFAULT 0 | Khoảng cách ngày ôn tiếp theo |
| `repetitions` | INT | NOT NULL, DEFAULT 0 | Số lần đã ôn tập thành công liên tiếp |
| `next_review_at` | TIMESTAMPTZ | NOT NULL | Thời điểm đến hạn ôn tập tiếp theo |
| `last_rating` | VARCHAR(20) | NULL | Đánh giá lần cuối: `AGAIN`, `HARD`, `GOOD`, `EASY` |
| `is_starred` | BOOLEAN | NOT NULL, DEFAULT FALSE | Đánh dấu thẻ quan trọng để học riêng |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thời gian cập nhật gần nhất |

---

#### 8. Bảng `user_deck_progress` (Composite Key)
Theo dõi tiến độ tổng thể của User đối với một bộ thẻ cụ thể.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | FK -> `users.id`, NOT NULL | Một phần của PRIMARY KEY |
| `deck_id` | UUID | FK -> `decks.id`, NOT NULL | Một phần của PRIMARY KEY |
| `total_cards` | INT | NOT NULL | Tổng số thẻ trong deck tại thời điểm học |
| `learned_cards` | INT | NOT NULL, DEFAULT 0 | Số thẻ đã học ít nhất 1 lần (repetitions > 0) |
| `mastered_cards` | INT | NOT NULL, DEFAULT 0 | Số thẻ đã thành thạo (interval_days >= 21) |
| `last_studied_at` | TIMESTAMPTZ | NULL | Lần gần nhất học bộ thẻ này |
| `is_copied_from` | UUID | FK -> `decks.id`, NULL | ID deck gốc nếu đây là bản copy |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | |

**Đồng bộ `total_cards`:** Cột denormalized dễ stale khi thêm/xóa card. Migration phải tạo trigger `AFTER INSERT OR DELETE` trên `cards` cập nhật `user_deck_progress.total_cards` cho mọi user có progress trên deck đó. App layer vẫn gán `total_cards` khi khởi tạo progress lần đầu (copy deck, first review, import).

---

#### 9. Bảng `quizzes` (Kế thừa `BaseEntity`)
|Bộ câu hỏi trắc nghiệm do user tạo hoặc admin import từ CSV. User tạo quiz từ deck ở `DRAFT`; submit lên `PENDING` để admin duyệt → `APPROVED` (Explore) hoặc `REJECTED`.|

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `slug` | VARCHAR(120) | NOT NULL, UNIQUE | URL-friendly slug |
| `title` | VARCHAR(200) | NOT NULL | Tiêu đề |
| `description` | TEXT | NULL | Mô tả |
| `cover_image_url` | TEXT | NULL | Ảnh bìa |
| `deck_id` | UUID | FK -> `decks.id`, NULL | Deck gốc (GENERATED) |
| `owner_id` | UUID | FK -> `users.id`, NOT NULL | Người tạo |
| `owner_username` | VARCHAR(100) | NULL | Username người tạo |
| `status` | VARCHAR(20) | NOT NULL | `DRAFT`, `PENDING`, `APPROVED`, `REJECTED` |
| `quiz_type` | VARCHAR(20) | NOT NULL | `GENERATED` (từ deck), `IMPORTED` (CSV, admin) |
| `is_immutable` | BOOLEAN | NOT NULL, DEFAULT FALSE | Khóa sửa; IMPORTED luôn TRUE |
| `is_public` | BOOLEAN | NOT NULL, DEFAULT FALSE | Hiển thị Explore |
| `time_limit_seconds` | INT | NULL | Thời gian làm bài (giây) |
| `question_count` | INT | NOT NULL | Số câu hỏi |
| `attempt_count` | INT | NOT NULL, DEFAULT 0 | Tổng lượt làm |
| `avg_score` | DOUBLE | NULL | Điểm TB (cập nhật sau mỗi lượt) |
| `rejection_note` | TEXT | NULL | Lý do từ chối (admin) |

**Luồng trạng thái:** `DRAFT` → (user submit) → `PENDING` → (admin approve) → `APPROVED` | (admin reject) → `REJECTED`

---

#### 10. Bảng `quiz_questions` (Kế thừa `BaseEntity`)
|Danh sách câu hỏi — được tạo khi user tạo quiz từ deck hoặc import CSV. Mỗi quiz có N câu hỏi cố định; `startQuiz()` chỉ shuffle thứ tự, không tạo mới.|

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `quiz_id` | UUID | FK -> `quizzes.id`, NOT NULL | Thuộc quiz nào |
| `card_id` | UUID | FK -> `cards.id`, NULL | Thẻ gốc (GENERATED) |
| `question_type` | VARCHAR(30) | NOT NULL | `MULTIPLE_CHOICE`, `TRUE_FALSE`, `FILL_IN` |
| `question_text` | TEXT | NOT NULL | Câu hỏi |
| `correct_answer` | TEXT | NOT NULL | Đáp án đúng |
| `options` | TEXT | NULL | JSON array đáp án sai (empty cho FILL_IN) |
| `sort_order` | INT | NOT NULL, DEFAULT 0 | Thứ tự câu hỏi |

---

#### 11. Bảng `quiz_attempts` (Kế thừa `BaseEntity`)
|Lịch sử làm bài trắc nghiệm. Mỗi lượt chơi tạo 1 record. Redis lưu session để resume + timer. `score` = `correct_answers / total_questions`.|

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `user_id` | UUID | FK -> `users.id`, NOT NULL | Người làm bài |
| `quiz_id` | UUID | FK -> `quizzes.id`, NULL | Quiz chơi |
| `score` | FLOAT | NOT NULL, DEFAULT 0 | Điểm số (0.0 → 1.0) |
| `total_questions` | INT | NOT NULL | Tổng câu hỏi |
| `correct_answers` | INT | NOT NULL, DEFAULT 0 | Số câu đúng |
| `xp_earned` | INT | NOT NULL, DEFAULT 0 | XP nhận được |
| `time_taken_seconds` | INT | NULL | Thời gian hoàn thành (giây) |
| `started_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thời điểm bắt đầu |
| `finished_at` | TIMESTAMPTZ | NULL | Thời điểm nộp bài |

---

#### 12. Bảng `quiz_answers` (Kế thừa `BaseEntity`)
Chi tiết câu trả lời của người dùng trong mỗi câu hỏi của lượt kiểm tra.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `attempt_id` | UUID | FK -> `quiz_attempts.id`, NOT NULL| Lượt kiểm tra |
| `question_id` | UUID | FK -> `quiz_questions.id`, NOT NULL| Câu hỏi |
| `selected_answer`| TEXT | NULL | Câu trả lời người dùng đã chọn |
| `is_correct` | BOOLEAN | NOT NULL | Đánh giá đúng/sai |
| `answered_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thời điểm trả lời |

---

#### 13. Bảng `quiz_sessions` (Kế thừa `BaseEntity`)
Theo dõi phiên làm bài đang diễn ra tạm thời từ phía server, hỗ trợ timeout và resume.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `attempt_id` | UUID | FK -> `quiz_attempts.id`, NOT NULL | Lượt kiểm tra tương ứng |
| `user_id` | UUID | FK -> `users.id`, NOT NULL | Người dùng làm bài |
| `quiz_id` | UUID | FK -> `quizzes.id`, NOT NULL | Quiz đang làm |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'IN_PROGRESS' | Trạng thái: `IN_PROGRESS`, `COMPLETED`, `ABANDONED` |
| `started_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Thời gian bắt đầu |
| `ended_at` | TIMESTAMPTZ | NULL | Thời gian kết thúc |
| `last_activity` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Dấu thời gian hoạt động cuối để kiểm tra timeout |

---

#### 14. Bảng `quiz_cooldown_settings` (Kế thừa `BaseEntity`)
Cấu hình giới hạn làm bài chống Spam Quiz (Admin Config) hoặc Bypass cho từng user.

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `enabled` | BOOLEAN | NOT NULL, DEFAULT TRUE | Kích hoạt hệ thống Spam |
| `min_seconds_between_attempts` | INT | NOT NULL, DEFAULT 600 | Khoảng cách giới hạn (giây) giữa 2 lần làm quiz |
| `max_attempts_per_quiz_per_day` | INT | NOT NULL, DEFAULT 5 | Số lượt tối đa cho 1 quiz/ngày |
| `max_total_attempts_per_day` | INT | NOT NULL, DEFAULT 20 | Tổng số lượt quiz/ngày tối đa |
| `max_total_attempts_per_week` | INT | NOT NULL, DEFAULT 50 | Tổng số lượt quiz/tuần tối đa |
| `bypass_user_id` | UUID | NULL | Cấu hình bỏ qua ngoại lệ cho User chỉ định |
| `bypass_quiz_id` | UUID | NULL | Cấu hình bỏ qua ngoại lệ cho Quiz chỉ định |

---

#### 15. Bảng `daily_activity` (Composite Key)
Thống kê hoạt động học tập hàng ngày của người dùng để vẽ heatmap (GitHub-style calendar).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | FK -> `users.id`, NOT NULL | Một phần của PRIMARY KEY |
| `activity_date` | DATE | NOT NULL | Một phần của PRIMARY KEY |
| `cards_reviewed` | INT | NOT NULL, DEFAULT 0 | Số thẻ đã ôn tập trong ngày |
| `quiz_taken` | INT | NOT NULL, DEFAULT 0 | Số lượt quiz đã hoàn thành |
| `xp_earned` | INT | NOT NULL, DEFAULT 0 | Số XP tích lũy trong ngày |
| `study_minutes` | INT | NOT NULL, DEFAULT 0 | Ước tính số phút học |

---

#### 16. Bảng `async_jobs` (Kế thừa `BaseEntity`)
Theo dõi trạng thái các tác vụ xử lý nền không đồng bộ (AI Generate, File Import).

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | |
| `type` | VARCHAR(30) | NOT NULL | Loại job: `AI_GENERATE`, `FILE_IMPORT` |
| `status` | VARCHAR(30) | NOT NULL | Trạng thái: `PENDING`, `PROCESSING`, `DONE`, `FAILED` |
| `user_id` | UUID | FK -> `users.id`, NOT NULL | Người kích hoạt tác vụ |
| `result` | JSONB | NULL | Kết quả (Ví dụ: `{"deck_id": "uuid"}`) hoặc log lỗi |

---

### 2.3. Thiết lập Indexes, Full-Text Search & Triggers

#### Indexes

```sql
-- Deck listing & library
CREATE INDEX idx_decks_owner ON decks(owner_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_decks_owner_slug ON decks(owner_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_decks_public_slug ON decks(slug) WHERE deleted_at IS NULL AND is_public = TRUE;
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
CREATE INDEX idx_quizzes_slug ON quizzes(slug);
CREATE INDEX idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id, started_at DESC);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(attempt_id);

-- Async jobs: user poll & cleanup
CREATE INDEX idx_async_jobs_user_status ON async_jobs(user_id, status, created_at DESC);
```

#### Full-Text Search (generated column)

Dùng config `'simple'` (không stem) — phù hợp nội dung song ngữ en/vi ở quy mô nhỏ. Cột `search_vector` được định nghĩa trong bảng `decks` và `cards` (§2.2):

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

Query pattern: `WHERE search_vector @@ plainto_tsquery('simple', :q)`

**Quy tắc app cho `user_card_review.deck_id`:** Gán `deck_id` khi tạo review record (copy deck, first review, import). Khi card chuyển deck (nếu có) — cập nhật đồng bộ trong cùng transaction.

#### Bảng `deck_moderation_logs` (audit approve/reject)
```sql
CREATE TABLE deck_moderation_logs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id        UUID NOT NULL REFERENCES decks(id),
    moderator_id   UUID NOT NULL REFERENCES users(id),
    action         VARCHAR(20) NOT NULL, -- APPROVE / REJECT
    note           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

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

## 3. Xác thực & Phân quyền (Authentication & Authorization)

Hệ thống triển khai cơ chế xác thực **Token-Based Authentication** sử dụng JWT và phân quyền theo vai trò **RBAC** (Role-Based Access Control).

### 3.1. Luồng Token (Access Token & Refresh Token)
1. **Đăng nhập thành công**: Server trả về:
   - `accessToken`: JWT lưu ở memory/state của client, có thời gian sống ngắn (**15 phút**). Chứa claims: `sub` (userId), `username`, `role`.
   - `refreshToken`: UUID hoặc Random String lưu ở Secure Cookie (`httpOnly`, `secure`, `sameSite=Strict`), có thời gian sống dài (**7 ngày**).
2. **Lưu trữ Refresh Token**: Backend lưu refresh token vào **Redis** dưới dạng key-value: `refresh_token:{userId} -> {token_value}` với TTL 7 ngày.
3. **Cơ chế Silent Refresh**: Khi `accessToken` hết hạn, Axios Interceptor ở frontend tự động gọi API `/api/v1/auth/refresh` (cookie đính kèm tự động). Backend đối chiếu cookie với giá trị lưu trong Redis. Nếu khớp, cấp cặp `accessToken` mới.
4. **Đăng xuất (Logout)**: API `/api/v1/auth/logout` được gọi. Backend xóa key `refresh_token:{userId}` khỏi Redis, vô hiệu hóa hoàn toàn token.

---

### 3.2. Bảng phân quyền Role-Based Access Control (RBAC)

| Chức năng | Khách (Guest) | Thành viên (USER) | Quản trị viên (ADMIN) |
| :--- | :---: | :---: | :---: |
| Xem danh sách Deck công khai | ✅ | ✅ | ✅ |
| Đăng ký / Đăng nhập | ✅ | ❌ | ❌ |
| Xem thông tin cá nhân (`/me`) | ❌ | ✅ | ✅ |
| Tạo, chỉnh sửa, xóa Deck của mình | ❌ | ✅ | ✅ |
| Sao chép (Copy) Deck công khai | ❌ | ✅ | ✅ |
| Ôn tập thẻ (SRS), làm bài Quiz | ❌ | ✅ | ✅ |
| Đánh dấu sao (Starred) thẻ | ❌ | ✅ | ✅ |
| Tạo / Xóa tag cá nhân (`deck_tags`) | ❌ | ✅ | ✅ |
| Chọn topic hệ thống cho deck công khai | ❌ | ✅ | ✅ |
| Quản lý danh mục Topics hệ thống | ❌ | ❌ | ✅ |
| Khóa / Mở khóa tài khoản người dùng | ❌ | ❌ | ✅ |
| Xem dashboard thống kê hệ thống | ❌ | ❌ | ✅ |

---

## 4. Đặc tả API Endpoints (API Specification)

Tất cả các API được phiên bản hóa với tiền tố `/api/v1`. Dữ liệu trả về mặc định có định dạng JSON.

### 4.1. Danh sách chi tiết API

#### Nhóm 1: Xác thực (`/api/v1/auth`)
- **`POST /register`**: Đăng ký tài khoản mới.
- **`POST /login`**: Đăng nhập, nhận token.
- **`POST /google`**: Đăng nhập bằng Google ID token (body: `{ "idToken": "..." }`); tạo/link user → JWT + refresh cookie.
- **`POST /refresh`**: Đổi refresh token lấy access token mới.
- **`POST /logout`**: Vô hiệu hóa refresh token.
- **`GET /me`**: Lấy thông tin user hiện tại qua access token.
- **`PUT /me`**: Cập nhật hồ sơ (`username`, `avatarUrl`). `avatarUrl` là URL ảnh (sau khi upload qua `/media/upload` hoặc link ngoài).
- **`PUT /me/password`**: Đổi mật khẩu (body: `currentPassword`, `newPassword`). Không áp dụng tài khoản OAuth; sau đổi mật khẩu refresh token bị thu hồi — cần đăng nhập lại.

#### Nhóm 2: Chủ đề hệ thống (`/api/v1/topics`)
- **`GET /`**: Danh sách tất cả topic để phân loại (public).
- **`POST /`**: Tạo topic mới (ADMIN).
- **`GET /{topicRef}`**: Chi tiết topic — `topicRef` = slug hoặc UUID.
- **`PUT /{topicRef}`**: Cập nhật topic (ADMIN).
- **`DELETE /{topicRef}`**: Xóa topic; gỡ liên kết `deck_topics` trước (ADMIN).

#### Nhóm 3: Bộ thẻ & Thẻ từ vựng (`/api/v1/decks`)
- **`GET /`**: Danh sách deck (`page`, `size`, `q`, `topicId` hoặc `topicSlug`, `mine`).
- **`POST /`**: Tạo deck trống (tự sinh `slug` từ `title` nếu không gửi).
- **`GET /{deckRef}`**: Chi tiết deck — `deckRef` = UUID hoặc `slug` (trong phạm vi deck user được xem).
- **`PUT /{deckRef}`**: Cập nhật deck (owner).
- **`DELETE /{deckRef}`**: Xóa mềm deck.
- **`POST /{deckRef}/copy`**: Copy deck công khai.
- **`GET /{deckRef}/cards`**: Danh sách thẻ (phân trang, default 50; `q` tìm front/back/phonetic).
- **`POST /{deckRef}/cards`**: Thêm thẻ.
- **`PUT /{deckRef}/cards/{cardId}`**: Sửa thẻ (`cardId` vẫn UUID).
- **`DELETE /{deckRef}/cards/{cardId}`**: Xóa mềm thẻ.

> **Quy ước slug:** `deckRef` nhận UUID hoặc slug. Slug unique theo `owner_id`. Response luôn trả cả `id` và `slug`.

> **Quiz (Sprint 4):** `quiz_attempts` sẽ thêm `slug` unique theo `(user_id, slug)` — path `/quiz/{attemptRef}`; chưa migration ở Sprint 2b.
    - **`POST /import`**: Nhập thẻ hàng loạt từ tệp (Multipart file: CSV). Trả về mã job bất đồng bộ.

#### Nhóm 4: Nhãn cá nhân (`/api/v1/decks/{id}/tags`)
- **`GET /`**: Lấy các tag cá nhân mà user đã gắn cho deck này.
- **`PUT /`**: Cập nhật danh sách tags (Gửi kèm mảng chuỗi, ví dụ: `["daily", "difficult"]`).
- **`DELETE /{tagName}`**: Xóa một tag cụ thể khỏi deck.

#### Nhóm 5: Ôn tập thuật toán SRS (`/api/v1/flashcards`)
- **`POST /{deckRef}/start`**: Bắt đầu phiên học (Study Session).
- **`POST /{attemptId}/submit`**: Nộp bài kiểm tra/ôn tập thủ công.
- **`GET /{attemptId}/result`**: Lấy kết quả phiên học.
- **`GET /due-count`**: Đếm số thẻ đến hạn ôn tập hiện tại.
- **`GET /due`**: Lấy danh sách thẻ đến hạn (`?deckRef=deckId`, `?limit=50`, `?starredOnly=true/false`).
- **`GET /progress`**: Lấy tiến trình học hiện tại của bộ thẻ.
- **`POST /{cardId}/rate`**: Gửi đánh giá AGAIN / HARD / GOOD / EASY (SM-2).
- **`POST /{cardId}/star`**: Đánh dấu / bỏ sao thẻ.

#### Nhóm 6: Quiz — CRUD, Explore & Play (`/api/v1/quizzes`)

**Explore (public):**
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/explore?sort=newest|popular|trending` | Danh sách quiz APPROVED (phân trang) |
| `GET` | `/explore/{quizRef}` | Chi tiết quiz APPROVED |

**My Quizzes (user):**
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/me` | Quiz của tôi (tất cả status) |
| `POST` | `/` | Tạo quiz từ deck (`DRAFT`) |
| `POST` | `/import` | Import quiz từ CSV (`DRAFT`, editable) |
| `GET` | `/me/{quizRef}` | Chi tiết quiz của tôi |
| `PUT` | `/{quizRef}` | Cập nhật quiz |
| `DELETE` | `/{quizRef}` | Xóa quiz |
| `POST` | `/{quizRef}/questions` | Thêm câu hỏi |
| `PUT` | `/{quizRef}/questions/{questionId}` | Sửa câu hỏi |
| `DELETE` | `/{quizRef}/questions/{questionId}` | Xóa câu hỏi |
| `POST` | `/submit-review` | Gửi quiz lên duyệt (DRAFT → PENDING) |

**Play:**
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/{quizRef}/start` | Bắt đầu làm quiz, trả lời `attemptId` + `questions` |
| `GET` | `/{quizRef}/cooldown-status` | Kiểm tra trạng thái giới hạn lượt chơi của quiz |
| `POST` | `/sessions/{attemptId}/answer` | Gửi nộp 1 câu trả lời trong session |
| `POST` | `/sessions/{attemptId}/sync` | Đồng bộ hàng loạt câu trả lời |
| `POST` | `/sessions/{attemptId}/skip` | Bỏ qua 1 câu hỏi |
| `POST` | `/submit` | Chỉ định nộp bài sớm để rinh điểm |
| `POST` | `/quit/{attemptId}` | Bỏ thi / Thoát session (STATUS: ABANDONED) |
| `GET` | `/resume/{attemptId}` | Resume session đang dở |
| `POST` | `/session/heartbeat` | Gửi heartbeat để extend session |
| `GET` | `/me/active-sessions` | Lấy các session đang dở |
| `GET` | `/attempts/{attemptId}` | Kết quả lượt chơi |
| `GET` | `/attempts` | Lịch sử lượt chơi |
| `GET` | `/{quizRef}/leaderboard` | Bảng xếp hạng quiz (top 50) |

**Admin Moderation:**
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/admin/import` | Import quiz từ CSV |
| `GET` | `/admin/pending` | Quiz đang chờ duyệt |
| `GET` | `/admin/pending/count` | Số quiz chờ duyệt |
| `POST` | `/admin/moderate` | Duyệt/từ chối quiz |
| `GET` | `/admin/all` | Tất cả quiz (ADMIN) |
| `GET` | `/admin/{quizRef}` | Chi tiết quiz (ADMIN) |
| `PUT` | `/admin/{quizRef}` | Cập nhật quiz (ADMIN) |
| `PUT` | `/admin/{quizRef}/questions/{questionId}` | Sửa câu hỏi (ADMIN) |
| `POST` | `/admin/{quizRef}/questions` | Thêm câu hỏi (ADMIN) |
| `DELETE` | `/admin/{quizRef}/questions/{questionId}` | Xóa câu hỏi (ADMIN) |

**Notes:**
- `quizRef` = UUID hoặc slug
- Quiz APPROVED mới nhận XP và xuất hiện trên leaderboard
- Owner làm quiz không nhận XP (self-study)
- Redis lưu session để resume + timer enforcement

#### Nhóm 7: Tiến trình học & Gamification (`/api/v1/progress` & `/api/v1/stats`)
- **`GET /progress/me`**: Lấy rank, XP, total participants.
- **`GET /progress/leaderboard?limit=50`**: Global leaderboard.
- **`GET /progress/heatmap?year=2026&month=7`**: Heatmap data cho 1 tháng cụ thể.
- **`GET /stats/dashboard`**: Lấy 4 chỉ số thống kê tổng quát của user hiện tại.
- **`GET /stats/activity`**: Thống kê hoạt động N ngày qua.
- **`GET /stats/weekly`**: Xem báo cáo tuần và biểu đồ cột.

#### Nhóm 7b: Quiz Leaderboard (`/api/v1/quizzes`)
- **`GET /quizzes/leaderboard?limit=20`**: Global quiz leaderboard — hiệu suất tổng across all approved quizzes. Mỗi user lấy best attempt per quiz, rank theo total best score.

#### Nhóm 8: File Storage Upload (`/api/v1/media`)
- **`POST /upload`**: Multipart upload lên Cloudinary. Query `folder`: `avatars` | `cards` | `decks` | `audio`. Ảnh: JPEG/PNG/WebP/GIF; audio: MP3/WAV/OGG/WebM.

#### Nhóm 9: Admin Management (`/api/v1/admin`)
- **`GET /users`**: Danh sách user hệ thống (phân trang).
- **`GET /users/{userId}`**: Xem chi tiết một user cụ thể.
- **`PATCH /users/{userId}`**: Cập nhật Role (Phân quyền) hoặc Active (Ban/Khóa).
- **`GET /stats`**: Tổng số user, deck, card, quiz_attempt toàn hệ thống.
- **`GET /decks/{deckRef}`**: Truy cập đặc biệt để xem Deck của user khác.
- **`GET /decks/{deckRef}/cards`**: Lấy danh sách Cards bypass role-check.

#### Nhóm 10: Deck Approval & Moderation (`/api/v1/decks`)
- **`POST /{deckRef}/submit-for-approval`**: Gửi deck cá nhân lên Explore.
- **`POST /admin/decks/{deckRef}/approve`**: Duyệt deck.
- **`POST /admin/decks/{deckRef}/reject`**: Từ chối deck.

---

### 4.2. Minh họa Request/Response mẫu (DTOs)

#### 1. Đăng nhập (`POST /api/v1/auth/login`)
* **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecretPassword123"
}
```
* **Response (200 OK)**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": "8f8c8577-c87d-41a4-9642-1e9bf433cb8e",
    "username": "learning_champion",
    "email": "user@example.com",
    "role": "USER",
    "xp": 1250,
    "streak": 5
  }
}
```

#### 2. Gửi đánh giá SRS (`POST /api/v1/flashcards/{cardId}/rate`)
* **Request Body**:
```json
{
  "rating": "GOOD" 
}
// Các giá trị hợp lệ: "AGAIN" (quên hoàn toàn), "HARD" (nhớ mang máng), "GOOD" (nhớ tốt), "EASY" (nhớ cực kỳ dễ dàng)
```
* **Response (200 OK)**:
```json
{
  "cardId": "4d5e6f7a-8b9c-0d1e-2f3a-4b5c6d7e8f9a",
  "repetitions": 3,
  "easeFactor": 2.6,
  "intervalDays": 6,
  "nextReviewAt": "2026-06-12T04:00:00Z",
  "xpEarned": 10
}
```



## 5. Thuật toán cốt lõi & Logic nghiệp vụ

### 5.1. Thuật toán Spaced Repetition (SuperMemo-2 / SM-2)
Khi người dùng ôn tập một thẻ từ vựng và chọn chất lượng phản hồi `q` (tương ứng với các mức rating từ 0 đến 3), hệ thống sẽ tính toán lại Hệ số dễ dàng (Ease Factor - $EF$) và khoảng cách ngày ôn tập tiếp theo ($I$ - Interval).

#### Ánh xạ chất lượng phản hồi:
- `AGAIN` $\rightarrow q = 0$ (Quên hoàn toàn)
- `HARD`  $\rightarrow q = 1$ (Nhớ mang máng, tốn nhiều thời gian suy nghĩ)
- `GOOD`  $\rightarrow q = 2$ (Nhớ chính xác nhưng có chút do dự)
- `EASY`  $\rightarrow q = 3$ (Nhớ ngay lập tức không do dự)

#### Công thức tính toán:
1. **Hệ số dễ (Ease Factor - $EF$):**
   $$EF_{new} = EF_{old} + (0.15 - (3 - q) \times (0.08 + (3 - q) \times 0.02))$$
   *Lưu ý: Nếu $EF_{new} < 1.3$, hệ thống sẽ gán cứng bằng $1.3$ (ngưỡng giới hạn dưới).*

2. **Số lần lặp lại ($Repetitions - n$):**
   - Nếu $q = 0$ (`AGAIN`): Reset số lần lặp lại liên tiếp $n = 0$.
   - Nếu $q \ge 1$: Tăng số lần lặp lại liên tiếp $n = n + 1$.

3. **Khoảng cách ngày ôn tập tiếp theo ($Interval - I$):**
   - Nếu $n = 0$ (`AGAIN`): Ôn tập lại ngay lập tức (cùng ngày, $I = 0$).
   - Nếu $n = 1$: Khoảng cách ôn tiếp theo là $I = 1$ ngày.
   - Nếu $n = 2$: Khoảng cách ôn tiếp theo là $I = 3$ ngày.
   - Nếu $n = 3$: Khoảng cách ôn tiếp theo là $I = 6$ ngày.
   - Nếu $n > 3$: Khoảng cách ôn tiếp theo tính theo công thức:
     $$I_{n} = \lceil I_{n-1} \times EF_{new} \rceil$$

4. **Tính thời gian đến hạn (`next_review_at`):**
   $$\text{next\_review\_at} = \text{Thời điểm hiện tại} + I \text{ ngày}$$

---

### 5.2. Streak, Progress & Leaderboard

#### 5.2.1. Streak (chuỗi học liên tiếp)

Hệ thống duy trì streak (số ngày học liên tiếp) để tăng tính gắn kết. **Không áp dụng cho tài khoản ADMIN.**

**Điều kiện đạt streak trong ngày** (kiểm tra tại `DailyActivity`):
- Tổng số thẻ ôn (SRS flashcard) trong ngày **≥ 10 thẻ**, HOẶC
- Tổng số quiz đã submit trong ngày **≥ 1 quiz**

**Quy trình cập nhật streak** (gọi `StreakService.recordStudyActivity()` sau khi `DailyActivity` được ghi):

```
Ngày hiện tại (UTC) − lastStudyDate (UTC):
  = 0  → Đã học hôm nay → bỏ qua (streak giữ nguyên)
  = 1  → Học tiếp ngày liền kề → streak++
  > 1  → Đã bỏ ≥ 1 ngày → streak reset về 1
  null → Lần đầu học → streak = 1
```

**Scheduler tự động reset** (`@Scheduled(cron = "0 0 1 * * *", zone = "UTC")`, 01:00 UTC hàng ngày):
- Quét tất cả user active, nếu `lastStudyDate` cách hôm nay ≥ 2 ngày → `streak = 0`
- (User chưa đạt threshold hôm nay sẽ không bị reset ngay — streak vẫn giữ nếu đã học đủ từ hôm qua trở về trước)

**Admin utility**: `StreakService.recalculateStreak(userId)` — duyệt ngược DailyActivity từ hôm nay để tính lại streak chính xác.

#### 5.2.2. Progress (XP, Heatmap, Rank)

- **XP**: Cộng khi user hoàn thành ôn thẻ (SRS rating) hoặc submit quiz. Mỗi thẻ +5 XP, mỗi quiz +`quizXpEarned` (dựa trên score).
- **Heatmap 365 ngày**: Trả về từ bảng `daily_activity` — `{ date, cardsReviewed, quizTaken, xpEarned }`.
- **Rank**: Lấy từ Redis ZSET `lumotus:leaderboard:global` — `reverseRank(userId) + 1`. ADMIN không xuất hiện trên leaderboard.

#### 5.2.3. Global Leaderboard (XP + Streak)

- **Redis ZSET** key: `lumotus:leaderboard:global`
- **Composite score**: `xp * 1000 + streak` (XP là primary, streak break ties)
- **ADMIN bị loại**: Không bao giờ xuất hiện trên leaderboard.
- **Refresh**: `@Scheduled(fixedRate = 300_000)` — full refresh từ DB vào Redis mỗi 5 phút.
- **Live update**: `LeaderboardService.updateUserScore(userId)` được gọi ngay sau khi `FlashcardService` hoặc `QuizService` cộng XP.
- **Endpoint**: `GET /progress/leaderboard?limit=50` → top N theo composite score.

#### 5.2.4. Global Quiz Leaderboard (Performance)

- **Khác với global leaderboard**: Đo hiệu suất quiz (score + correct answers) thay vì XP/streak.
- **Aggregation**: Mỗi user lấy best attempt per approved quiz, rồi rank theo total score.
- **Endpoint**: `GET /quizzes/leaderboard?limit=20` → `{ userId, username, avgBestScore, totalAttempts, totalCorrectAnswers, rank }`.
- **Dùng ở**: Sidebar trang `/explore` — "Bảng xếp hạng Quiz" (top quiz performers).

---

### 5.3. Xử lý tác vụ nền bất đồng bộ (Asynchronous Tasks)
Để tránh block luồng HTTP request chính của người dùng đối với các tác vụ tốn thời gian (gọi API AI, phân tích tệp import lớn):
- Hệ thống sử dụng interface `TaskDispatcher` và implement mặc định là `SpringAsyncDispatcher` (chạy trên Thread Pool cấu hình qua `@Async`).
- Khi user gửi yêu cầu, backend tạo một bản ghi trong bảng `async_jobs` với trạng thái `PENDING`, đưa tác vụ vào queue/thread pool, rồi trả về `jobId` ngay lập tức với mã HTTP `202 Accepted`.
- Tác vụ chạy nền cập nhật trạng thái job thành `PROCESSING`. Sau khi hoàn tất (thành công hay thất bại), cập nhật trạng thái thành `DONE` hoặc `FAILED` kèm theo payload chi tiết ở cột `result` (JSON).

---

### 5.4. Quiz System — CRUD, Play & Leaderboard

Quiz là hệ thống câu hỏi trắc nghiệm persistent. Khác với Study Modes (in-memory), Quiz tạo câu hỏi cố định được lưu vào `quiz_questions` khi quiz được tạo.

#### Tạo Quiz

1. User tạo quiz từ deck (chọn deck + title + questionCount)
2. Server tạo `Quiz` record ở status `DRAFT`
3. Server sinh N câu hỏi từ cards trong deck (shuffle, pick N)
4. Questions + wrong options được lưu vào `quiz_questions`
5. User có thể chỉnh sửa/xóa/thêm questions (nếu không phải `IMPORTED`)
6. User submit → status `PENDING` → admin approve (`APPROVED`) hoặc reject (`REJECTED`)

#### Làm Quiz (Play)

1. `POST /quizzes/{quizRef}/start` — tạo `QuizAttempt`, shuffle questions, trả về list
2. User làm bài (MCQ, FILL_IN, TRUE_FALSE)
3. `POST /quizzes/submit` — nộp bài
4. Server validate: ownership, duplicate submit, time limit (Redis)
5. Tính score, XP (chỉ quiz APPROVED + không phải owner), update leaderboard
6. Trả về result với chi tiết từng câu

#### Scoring & XP

- `score = correctAnswers / totalQuestions` (0.0 → 1.0)
- `xpEarned = correct * 10 + (perfect ? 20 : 0)`
- XP chỉ khi: quiz `APPROVED` + không phải owner + competitive play

#### Quiz Anti-Cheat & Cooldown

**Đã implement (Giai đoạn 1):**
- Cooldown giữa các lần thử quiz với tham số admin-configurable
- Giới hạn attempts theo quiz/ngày, tổng/ngày, tổng/tuần

**Cấu hình cooldown** (`quiz_cooldown_settings` table, singleton row `id=00000000-0000-0000-0000-000000000001`):

| Tham số | Mặc định | Mô tả |
|---------|-----------|--------|
| `enabled` | `true` | Bật/tắt cooldown toàn cục |
| `min_seconds_between_attempts` | 600 | Tối thiểu giây giữa 2 lần thử cùng quiz |
| `max_attempts_per_quiz_per_day` | 5 | Max lần thử mỗi quiz mỗi ngày |
| `max_total_attempts_per_day` | 20 | Max lần thử tất cả quiz mỗi ngày |
| `max_total_attempts_per_week` | 50 | Max lần thử tất cả quiz mỗi tuần |

**Admin bypass:** Cho phép bypass cooldown cho user/quiz cụ thể với thời hạn.

**API cooldown:**
- `GET /api/v1/quizzes/{quizRef}/cooldown-status` — Check cooldown (user)
- `GET /api/v1/admin/quiz-cooldown/settings` — Lấy cấu hình (ADMIN)
- `PUT /api/v1/admin/quiz-cooldown/settings` — Cập nhật cấu hình (ADMIN)
- `POST /api/v1/admin/quiz-cooldown/bypass` — Set bypass (ADMIN)
- `DELETE /api/v1/admin/quiz-cooldown/bypass` — Xóa bypass (ADMIN)
- `GET /api/v1/admin/quiz-cooldown/check?userId=&quizId=` — Check bất kỳ user-quiz (ADMIN)

**Khi vi phạm cooldown:** HTTP 429 Too Many Requests với body `CooldownApiError` chứa:
- `violation`: loại vi phạm
- `cooldownEndsAt`: thời điểm cooldown kết thúc
- `secondsUntilCooldownEnds`: số giây chờ
- `attemptsUsed` / `attemptsLimit`: số lần đã dùng / giới hạn

**Planned:**
- Bot detection: answer timing analysis (< 2s/câu = suspicious)

---

## 6. Định dạng file Import & Quy chuẩn

Để import từ vựng hàng loạt từ file Excel/CSV thành công, dữ liệu phải tuân thủ đúng định dạng quy định dưới đây:

### 6.1. File CSV tiêu chuẩn (Encoding: UTF-8)
Dòng đầu tiên là tiêu đề (header) bắt buộc khớp chính xác tên trường. Phân cách bằng dấu phẩy `,`.

```csv
front,back,phonetic,part_of_speech,example,hint
abundant,nhiều, dồi dào,/əˈbʌndənt/,adjective,There is an abundant supply of fresh water.,synonym: plentiful
compile,biên soạn,/kəmˈpaɪl/,verb,We need to compile the data into a report.,collect information
```

### 6.2. Quy tắc Validation khi import:
- Trường `front` và `back` là **bắt buộc** và không được để trống. Nếu trống, dòng đó sẽ bị bỏ qua và ghi nhận lỗi vào log `skippedRows`.
- Độ dài tối đa của `front` và `back` là 1000 ký tự.
- Các trường `phonetic`, `part_of_speech`, `example`, `hint` là tùy chọn (optional).
- Mặc định, nếu không truyền ngôn ngữ, backend tự nhận diện theo cài đặt ngôn ngữ mặc định của bộ thẻ.

---

## 7. Cấu hình Môi trường & DevOps

### 7.1. Cấu trúc Docker Compose nội bộ (`docker-compose.yml`)
Dành cho môi trường phát triển (Development), dựng sẵn PostgreSQL và Redis:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: lumotus-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: lumotus
      POSTGRES_USER: lumotus_user
      POSTGRES_PASSWORD: changeme
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: lumotus-redis
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    restart: unless-stopped

  pgadmin:
    image: dpage/pgadmin4
    container_name: lumotus-pgadmin
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@lumotus.local
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

### 7.2. DevOps Production Workflow (CI/CD)
1. **Mã nguồn đẩy lên branch `main`**: Kích hoạt GitHub Actions Workflow.
2. **Kiểm tra**: Chạy tự động các bài kiểm thử đơn vị (Unit Tests) với Maven.
3. **Đóng gói Docker**:
   - Sử dụng Multi-stage build cho cả Frontend và Backend để tối ưu dung lượng tệp tin build.
   - Build Image Backend $\rightarrow$ Push lên Registry (Docker Hub / Github Package).
   - Build Image Frontend $\rightarrow$ Chứa file tĩnh để Nginx phục vụ trực tiếp.
4. **Deploy**: Github Actions SSH vào máy chủ VPS, thực thi lệnh kéo image mới về và restart lại cụm container bằng `docker compose -f docker-compose.prod.yml up -d --build`.

---

## 8. Đối chiếu yêu cầu đề tài ban đầu

> Ma trận này căn theo đề cương: học từ vựng theo bộ thẻ + quiz ngắn + SRS.  
> **Cập nhật:** 2026-07-02 · Chi tiết sprint: [`development-plan.md`](development-plan.md) · Tiến độ code: [`progress.md`](progress.md)

**Ký hiệu:** ✅ Đã có (code/docs) · ⚠️ Một phần · ❌ Chưa · 📋 Chỉ có trong spec/roadmap

### 8.1. Giới thiệu đề tài

| Nội dung | Trạng thái |
|---|---|
| Hệ thống học từ vựng theo bộ thẻ (deck/card) | ✅ |
| Bài kiểm tra ngắn (quiz MCQ) | 📋 Sprint 5 |
| Ôn tập SRS (SM-2) | ✅ MVP |
| Gamification (XP, streak, leaderboard) | ✅ XP khi review, streak scheduler, Redis leaderboard |

### 8.2. Backend (Spring Boot 4)

#### Yêu cầu kỹ thuật nền

| Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|
| Spring Boot 4 | ✅ | |
| Spring Web (REST) | ✅ | prefix `/api/v1` |
| Spring Security | ✅ | JWT filter, refresh cookie |
| Spring Data JPA | ✅ | |
| PostgreSQL | ✅ | v17, Flyway V1–V5 |
| Flyway migration | ✅ | Không sửa file đã chạy |
| Bean Validation | ✅ | `@Valid` trên request DTO |
| Swagger / OpenAPI | ⚠️ | `springdoc-openapi` + `/swagger-ui.html`; chưa annotate đủ từng endpoint |
| JUnit + MockMvc | ✅ | 4 module test suite (`Auth`, `Deck`, `Review`, `Progress`) độc lập với `@Transactional`; 13/8 cases thành công vượt chỉ tiêu |
| JWT + Refresh Token | ✅ | Access 15m, refresh Redis 7d |
| RBAC USER / ADMIN | ✅ | `@PreAuthorize`, bootstrap ADMIN dev |
| Phân trang / lọc / sắp xếp | ✅ | `page`/`size` deck & card; topic filter |
| Xử lý lỗi tập trung | ✅ | `GlobalExceptionHandler` |

#### Nhóm API nghiệp vụ

| Nhóm | Trạng thái | Endpoint chính |
|---|---|---|
| Auth | ✅ | register, login, google, refresh, logout, me, password |
| Topics (Admin) | ✅ | CRUD slug |
| Decks & Cards | ✅ | CRUD, copy, import CSV, pagination |
| Tags cá nhân | 📋 | Spec §4 — chưa code |
| Media upload | ✅ | ảnh (`image/`) + audio (`audio/`) qua Cloudinary |
| SRS Review | ✅ | `FlashcardController`: due, rate, star, progress |
| Quiz | ✅ | Session validation, answer/skip/sync, anti-spam cooldown, global leaderboard |
| Progress | ✅ | Heatmap 365d, streak, stats dashboard (`StatsController`) |
| Leaderboard | ✅ | Redis ZSET, refresh 5min, live update on XP change |
| Admin | ✅ | QL người dùng, Admin dashboard stats (`AdminController`) |
| AI Generate | ❌ | **Khai tử (Cancelled)** — Lược bỏ khỏi scope để tối ưu Core tính năng SRS |

#### CSDL & kiểm thử bàn giao

| Hạng mục | Trạng thái |
|---|---|
| Lược đồ CSDL chuẩn hóa (3NF, UUID, junction PK) | ✅ | `spec.md` §2 + `V1`..`V24` migrations |
| Bộ test API tối thiểu **8 trường hợp** | ✅ | MockMvc: >= 13 cases thành công (Auth, Deck, Review, Progress) |
| Tài liệu Swagger/OpenAPI | ✅ | `/swagger-ui.html` hoạt động tốt trên production |

### 8.3. Frontend (React 18 + TypeScript)

#### 8.3.1. Mô tả giao diện & UX

| Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|
| Flip card animation | ✅ | CSS 3D Transforms trên `ReviewFlashcard` hoạt động mượt mà |
| Review session tương tác | ✅ | Again/Hard/Good/Easy, xáo trộn, sao |
| Dashboard tiến độ hàng ngày | ✅ | Hoàn thiện LandingPage, Dashboard stats, Heatmap trên ProgressPage |
| Offline cơ bản | 📋 | Bỏ qua (Not Requirement) |

#### 8.3.2. Công nghệ Frontend

| Công nghệ | Trạng thái |
|---|---|
| React 18 + TypeScript | ✅ |
| Vite | ✅ |
| TailwindCSS | ✅ v4 |
| Framer Motion | ⚠️ Có trong `package.json`, chưa dùng flip |
| React Query | ✅ |
| React Router v6 | ✅ |
| Axios | ✅ |
| Chart.js | ⚠️ Có `chart.js` + `react-chartjs-2`, chưa có trang Progress |

#### 8.3.3. Trang / màn hình

| Trang (đề tài) | Route Lumotus | Trạng thái |
|---|---|---|
| Thư viện Deck | `/library`, `/home` | ✅ Số lượng card, ngày học và tiến độ đồng bộ |
| Học Flashcard | `/decks/:deckRef/review` | ✅ |
| Study Modes | `/decks/:deckRef/study` | ✅ Cung cấp quiz mode session |
| Quiz | `/decks/:deckRef/quiz` | ✅ Submit liên tục, timer, đánh giá điểm chuẩn xác |
| Tiến độ & Heatmap | `/progress` | ✅ |
| Bảng xếp hạng | `/leaderboard` | ✅ |
| Admin | `/admin` | ✅ Phê duyệt Quiz, Khóa User, Thống kê Platform |

#### 8.3.4. Component chính

| Component (đề tài) | File / tương đương | Trạng thái |
|---|---|---|
| FlashCard (Framer Motion 3D) | `ReviewFlashcard.tsx` | ⚠️ CSS 3D, không Framer Motion |
| ReviewRatingButtons | `RatingButtonGroup.tsx` | ✅ màu + hint VI |
| **StudyHeader** | `StudyHeader.tsx` | ✅ Mới |
| **StudyConfigView** | `StudyConfigView.tsx` | ✅ Mới |
| **ModeDropdown** | `ModeDropdown.tsx` | ✅ Mới |
| **ModeSettings** | `ModeSettings.tsx` | ✅ Mới |
| **ResumeDialog** | `ResumeDialog.tsx` | ✅ Mới |
| **StudyEmptyState** | `StudyEmptyState.tsx` | ✅ Mới |
| **FlashcardResult** | `FlashcardResult.tsx` | ✅ Mới |
| **QuizResult** | `QuizResult.tsx` | ✅ Mới |
| LeaderboardTable | `pages/LeaderboardPage.tsx` | ✅ Global leaderboard (XP + streak composite) |

#### 8.3.5. Sản phẩm frontend bàn giao

| Hạng mục | Trạng thái |
|---|---|
| Animation mượt + UX | ✅ |
| Tích hợp đầy đủ API | ✅ | Ôn tập, Quiz, Progress, Thống kê, Quản trị Admin hoàn thiện |
| Responsive mọi thiết bị | ✅ | Navbar, Sidebar Layout và LandingPage hiển thị tốt mobile |
| README frontend | ✅ | Được tích hợp cẩn thận vào bảng `README.md` root |

### 8.4. Việc cần làm để đạt đủ đề tài

| Ưu tiên | Hạng mục | Trạng thái |
|---|---|---|
| P0 | MockMvc ≥ 8 test (Auth, Deck, Card, Review, Progress) | ✅ Xong (13+ tests hoàn hảo) |
| P0 | Quiz BE + FE + Màn hình Session | ✅ Xong |
| P0 | Progress heatmap + Dashboard Stats | ✅ Xong |
| P0 | Leaderboard BE + Global UI | ✅ Xong |
| P1 | Admin UI + Admin duyệt Decks/Users | ✅ Xong |
| P1 | Swagger UI `/swagger-ui.html` | ✅ Xong |
| P0 | **Hệ thống Streak Freeze** (Bảo vệ chuỗi) | ❌ Chờ Làm (Sprint tiếp theo) |
| P2 | Framer Motion / Offline Cache | ❌ Cancelled (Quá quy mô MVP) |
| P2 | AI Generate Async Jobs | ❌ Cancelled |
