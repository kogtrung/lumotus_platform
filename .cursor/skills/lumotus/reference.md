# Lumotus — tham chiếu kỹ thuật

## Bảng & kế thừa JPA

| Bảng | Kế thừa | Ghi chú |
|---|---|---|
| `users`, `topics`, `quiz_*`, `async_jobs` | `BaseEntity` | |
| `decks`, `cards` | `SoftDeleteEntity` | + `search_vector` STORED |
| `user_card_review`, `user_deck_progress`, `deck_topics`, `deck_tags`, `daily_activity` | — | Composite PK |

## Index quan trọng (§2.3)

```sql
-- SRS
idx_ucr_user_due (user_id, next_review_at)
idx_ucr_user_deck_due (user_id, deck_id, next_review_at)
idx_ucr_user_starred (user_id) WHERE is_starred

-- Listing
idx_decks_owner, idx_deck_topics_topic, idx_cards_deck_sort

-- Gamification
idx_users_xp_leaderboard, idx_users_last_study, idx_udp_user_studied

-- Quiz / async
idx_quiz_questions_deck, idx_quiz_attempts_user, idx_async_jobs_user_status
```

## Full-text search

```sql
-- Query
WHERE search_vector @@ plainto_tsquery('simple', :q)
```

Config `'simple'` — không stem, hỗ trợ en/vi ở quy mô nhỏ. JPA: bỏ qua hoặc `@Column(insertable=false, updatable=false)` cho `search_vector`.

## SM-2 rating map

| Rating | q | Hành vi |
|---|---|---|
| AGAIN | 0 | Reset repetitions, interval 0 |
| HARD | 1 | n++ |
| GOOD | 2 | n++ |
| EASY | 3 | n++ |

EF_new = EF_old + (0.15 - (3-q) × (0.08 + (3-q) × 0.02)); min EF = 1.3.

## Redis keys

| Key | TTL | Mục đích |
|---|---|---|
| `refresh_token:{userId}` | 7d | Revoke logout |
| `leaderboard` (ZSET) | — | `ZADD` xp member=userId; cache top 50 |
| `job:{jobId}` | 30m | Poll status |
| `topics:all` | 10m | Cache topics |

## Import CSV header

```
front,back,phonetic,part_of_speech,example,hint
```

`front` + `back` bắt buộc; max 1000 ký tự.

## Streak logic

- Tính streak khi ≥10 thẻ ôn hoặc 1 quiz/ngày
- Scheduler 00:01: reset streak user có `last_study_date < CURRENT_DATE - 1`

## Async pattern

```
Controller → TaskDispatcher (interface)
              └── SpringAsyncDispatcher (@Async)
```

Controller/Service không phụ thuộc implementation cụ thể.
