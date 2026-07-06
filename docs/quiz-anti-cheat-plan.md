# Quiz Anti-Cheat & Chống Gian Lận

> **Loại tài liệu:** Thiết kế kỹ thuật
> **Trạng thái:** Đang lên kế hoạch
> **Cập nhật lần cuối:** 2026-07-03

---

## 1. Phân tích hiện trạng

### Đã hoạt động tốt ✅

- Validation đáp án phía server (không bao giờ tin client)
- Xác minh quyền sở hữu quiz attempt
- Timer Redis (chống thao túng đồng hồ phía client)
- Deduplicate best-attempt cho leaderboard (chỉ tính điểm cao nhất mỗi user)
- Resume session từ Redis
- Chống duplicate submit

### Lỗ hổng ❌

| # | Lỗ hổng | Mức độ | Tác động |
|---|----------|--------|----------|
| 1 | Không giới hạn tốc độ khi start quiz | CAO | User spam session |
| 2 | Không có cooldown giữa các lần thử | CAO | User grinding leaderboard |
| 3 | Không phát hiện hành vi bot | TRUNG | Trả lời quá nhanh (< 2s/câu) |
| 4 | Không theo dõi focus browser/tab | TRUNG | Không phát hiện multi-tasking |
| 5 | Gửi toàn bộ câu hỏi ngay từ đầu | TRUNG | Cheater lấy trộm đáp án |
| 6 | Không giới hạn theo IP | TRUNG | Tạo nhiều tài khoản lạm dụng |
| 7 | Không có captcha sau nhiều lần thất bại | TRUNG | Brute force đáp án |
| 8 | Cache đáp án phía client | THẤP | localStorage lưu đáp án đúng (dù không hiển thị) |

---

## 2. Các biện pháp chống gian lận đề xuất

### 2.1 Giới hạn tốc độ & Cooldown (Ưu tiên: CAO)

#### Cooldown lần thử quiz
```java
// Bảng mới: quiz_attempt_cooldown
// user_id | quiz_id | last_attempt_at | attempt_count (hôm nay)
```

**Quy tắc:**
- Mỗi user tối đa **5 lần thử** mỗi quiz mỗi ngày
- Tối thiểu **10 phút** cooldown giữa các lần thử cùng quiz
- Cooldown reset lúc nửa đêm UTC

**Triển khai:**
```java
// Trong QuizAttemptRepository
@Query("""
    SELECT COUNT(qa) FROM QuizAttempt qa
    WHERE qa.user.id = :userId
    AND qa.quiz.id = :quizId
    AND qa.startedAt > :since
    """)
long countRecentAttempts(@Param("userId") UUID userId, @Param("quizId") UUID quizId,
                         @Param("since") Instant since);

@Query("""
    SELECT MAX(qa.startedAt) FROM QuizAttempt qa
    WHERE qa.user.id = :userId AND qa.quiz.id = :quizId
    """)
Optional<Instant> findLastAttemptTime(@Param("userId") UUID userId, @Param("quizId") UUID quizId);
```

#### Giới hạn attempt toàn cục
- Tối đa **20 lần thử quiz** mỗi ngày (tất cả quiz)
- Tối đa **50 lần thử quiz** mỗi tuần

### 2.2 Phát hiện Bot — Phân tích thời gian trả lời (Ưu tiên: CAO)

#### Kiểm tra tốc độ trả lời
```java
public record AnswerTiming(
    String questionId,
    Instant answeredAt,
    int timeFromStart  // giây
) {}

public record SuspiciousPattern(
    boolean tooFast,         // < 2s trung bình/câu
    boolean tooConsistent,   // variance < 0.5s (máy móc)
    boolean tooPerfect       // 100% đúng với < 3s trung bình
) {}
```

**Quy tắc:**
- Flag nếu trung bình thời gian/câu < 2 giây liên tục
- Flag nếu variance thời gian trả lời < 0.5s (quá đều)
- Flag nếu điểm hoàn hảo + tốc độ đáng ngờ
- Attempt bị flag không tính vào leaderboard nhưng vẫn ghi nhận

**Triển khai:**
```java
// Trong QuizService.submitQuiz()
private SuspiciousPattern analyzeAnswerTiming(
    List<AnswerSubmission> answers,
    int totalQuestions,
    int correctAnswers,
    int timeTakenSeconds
) {
    double avgTimePerQuestion = (double) timeTakenSeconds / totalQuestions;

    boolean tooFast = avgTimePerQuestion < 2.0;
    boolean tooConsistent = calculateVariance(answerTimings) < 0.5;
    boolean tooPerfect = correctAnswers == totalQuestions && avgTimePerQuestion < 3.0;

    return new SuspiciousPattern(tooFast, tooConsistent, tooPerfect);
}
```

### 2.3 Theo dõi Focus Browser/Tab (Ưu tiên: TRUNG)

#### Tracking phía Frontend
```typescript
// Trong QuizPlayPage.tsx
interface FocusEvent {
  event: 'focus' | 'blur' | 'visibility_hidden' | 'tab_switch'
  timestamp: number
  duration?: number  // cho blur events
}

const focusEvents: FocusEvent[] = []

useEffect(() => {
  const handleVisibilityChange = () => {
    focusEvents.push({
      event: document.hidden ? 'visibility_hidden' : 'focus',
      timestamp: Date.now()
    })
  }

  const handleBlur = () => {
    focusEvents.push({ event: 'blur', timestamp: Date.now() })
  }

  const handleFocus = () => {
    if (focusEvents.length > 0) {
      const last = focusEvents[focusEvents.length - 1]
      if (last.event === 'blur') {
        focusEvents.push({
          event: 'focus',
          timestamp: Date.now(),
          duration: Date.now() - last.timestamp
        })
      }
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('blur', handleBlur)
  window.addEventListener('focus', handleFocus)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('blur', handleBlur)
    window.removeEventListener('focus', handleFocus)
  }
}, [])
```

**Payload submit:**
```typescript
interface SubmitQuizPayload {
  attemptId: string
  answers: Answer[]
  timeTakenSeconds: number
  metadata?: {
    focusLossCount: number           // Số lần tab bị ẩn
    totalFocusLossDuration: number   // Tổng giây rời tab
    suspicious: boolean              // Flag client (chỉ tham khảo)
  }
}
```

**Phía server:**
- Log focus loss events để audit
- Flag attempt nếu > 5 lần mất focus hoặc > 30s tổng thời gian rời tab
- Attempt bị flag hiển thị trong admin dashboard

### 2.4 Giới hạn theo IP (Ưu tiên: TRUNG)

**Triển khai:** Dùng Redis cho rate limiting phân tán

```java
// Redis key patterns
quiz:rate:ip:{ipAddress}:day     // Attempts theo IP mỗi ngày
quiz:rate:ip:{ipAddress}:hour   // Attempts theo IP mỗi giờ

// Giới hạn
- Tối đa 50 attempts/IP/giờ
- Tối đa 200 attempts/IP/ngày
- Tối đa 5 user khác nhau từ cùng IP/giờ (phát hiện multi-account)
```

### 2.5 Cách ly giao câu hỏi (Ưu tiên: TRUNG)

**Hiện tại:** Tất cả câu hỏi gửi lên ngay từ đầu khi start

**Đề xuất:** Giao câu hỏi tiến bộ (cho quiz quan trọng)

```java
// Option A: Giao câu hỏi tiến bộ (bảo mật hơn)
@PostMapping("/{quizRef}/question/next")
public ResponseEntity<QuestionDeliveryResponse> getNextQuestion(
    @AuthenticationPrincipal UserPrincipal principal,
    @PathVariable String quizRef,
    @RequestBody QuestionRequest request  // { attemptId, previousQuestionId }
) {
    // Server fetch câu hỏi tiếp theo, không gửi tất cả cùng lúc
    // Phức tạp hơn nhưng bảo mật hơn
}

// Option B: Xác minh hash (đơn giản hơn)
@PostMapping("/{quizRef}/verify")
public ResponseEntity<VerificationResponse> verifyQuizIntegrity(
    @AuthenticationPrincipal UserPrincipal principal,
    @RequestBody VerificationRequest request  // { attemptId, clientHash }
) {
    // Client gửi hash của các câu hỏi nhận được
    // Server so sánh với hash mong đợi
    // Khớp = không gian lận
}
```

**Khuyến nghị:** Triển khai Option B (xác minh hash) trước — ít phức tạp, hiệu quả răn đe.

### 2.6 Kiểm duyệt & Review Admin (Ưu tiên: TRUNG)

#### Dashboard attempt bị flag
```sql
-- Bảng mới: quiz_attempt_flags
CREATE TABLE quiz_attempt_flags (
    id UUID PRIMARY KEY,
    attempt_id UUID REFERENCES quiz_attempts(id),
    flag_type VARCHAR(50),  -- 'FAST_ANSWERS', 'MULTI_ACCOUNT', 'SUSPICIOUS_PATTERN'
    flag_data JSONB,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id),
    action VARCHAR(20),  -- 'CONFIRMED', 'FALSE_POSITIVE', 'WARNED_USER'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Kiểm tra chất lượng Quiz (khi submit)
```java
// Trước khi publish lên Explore, kiểm tra chất lượng quiz
public record QuizQualityCheck(
    boolean hasMinQuestions,        // >= 5 câu hỏi
    boolean hasNoDuplicateAnswers, // Không trùng đáp án
    boolean hasValidOptions,       // Ít nhất 2 lựa chọn cho MCQ
    boolean hasNoProfanity,        // Không tục tiểu trong câu hỏi
    boolean hasReasonableDifficulty // Không quá dễ/khó
) {}
```

---

## 3. Các giai đoạn triển khai

### Giai đoạn 1: Ngay lập tức (Quick Wins)
- [ ] Thêm quiz attempt cooldown (10 phút giữa cùng quiz)
- [ ] Thêm giới hạn daily attempt (5/quiz, 20/ngày toàn cục)
- [ ] Thêm phân tích thời gian trả lời
- [ ] Thêm flag cho suspicious patterns

### Giai đoạn 2: Trung hạn
- [ ] Triển khai IP rate limiting với Redis
- [ ] Thêm browser focus tracking
- [ ] Tạo admin dashboard cho flagged attempts
- [ ] Thêm xác minh hash-based integrity

### Giai đoạn 3: Nâng cao (Tương lai)
- [ ] Giao câu hỏi tiến bộ
- [ ] CAPTCHA sau nhiều lần thất bại liên tiếp
- [ ] ML-based phát hiện bất thường
- [ ] Dashboard monitoring real-time

---

## 4. Kiểm duyệt Quiz do User tạo

### Quality Gates trước khi publish

```java
public record ModerationChecklist(
    boolean passed,
    List<String> issues,
    List<String> warnings
) {}

// Yêu cầu để đạt trạng thái APPROVED:
- Tối thiểu 5 câu hỏi
- Không trùng đáp án đúng
- Ít nhất 2 đáp án sai mỗi MCQ
- Không có từ tục
- Ít nhất 3 user khác nhau đã thử
- Điểm trung bình từ 20% - 95% (không quá dễ/khó)
```

### Tự động kiểm tra nội dung
```java
// Filter từ tục đơn giản
private static final Set<String> PROFANITY_LIST = Set.of(
    "từ_tục_1", "từ_tục_2" // mở rộng khi cần
);

// Kiểm tra mỗi câu hỏi
public boolean containsProfanity(String text) {
    String lower = text.toLowerCase();
    return PROFANITY_LIST.stream().anyMatch(lower::contains);
}
```

---

## 5. Giám sát & Cảnh báo

### Redis Keys cho giám sát
```
quiz:monitor:daily_attempts    // Counter số attempts hàng ngày
quiz:monitor:flagged_attempts  // Counter attempts bị flag
quiz:monitor:suspicious_ips    // Set các IP bị flag
```

### Ngưỡng cảnh báo
- > 100 attempts/giờ từ 1 IP → Cảnh báo + auto-block
- > 50% attempts bị flag → Review quy tắc anti-cheat
- Quiz mới với pass rate > 100% → Flag để review

---

## 6. Xử lý False Positive

### Quy trình khiếu nại của user
1. User thấy thông báo "attempt bị flag"
2. User yêu cầu review qua support
3. Admin xem lại dữ liệu thời gian + đáp án
4. Admin xác nhận (vô hiệu điểm) hoặc bác bỏ (khôi phục vào leaderboard)

### Phản ứng theo mức độ vi phạm
| Vi phạm | Lần 1 | Lần 2 | Lần 3+ |
|---------|-------|-------|--------|
| Trả lời quá nhanh | Cảnh cáo | Cấm 24h | Cấm 7 ngày |
| Multi-account | Cấm 1h | Cấm 24h | Cấm vĩnh viễn |
| Scraping | Block IP 1h | Block IP 24h | Block IP vĩnh viễn |

---

## 7. Ghi chú kỹ thuật

### Mẫu Redis Rate Limiting
```java
// Dùng Redis INCR với TTL
public boolean checkRateLimit(String key, int maxAttempts, Duration window) {
    Long count = redis.opsForValue().increment(key);
    if (count == 1) {
        redis.expire(key, window);
    }
    return count <= maxAttempts;
}
```

### Database Index cho truy vấn Anti-Cheat
```sql
-- Truy vấn nhanh cho rate limiting
CREATE INDEX idx_quiz_attempts_user_quiz_day
ON quiz_attempts(user_id, quiz_id, started_at DESC)
WHERE started_at > NOW() - INTERVAL '1 day';
```

---

## 8. Tóm tắt

**Checklist triển khai Giai đoạn 1:**
1. Thêm `countRecentAttempts` và `findLastAttemptTime` vào `QuizAttemptRepository`
2. Thêm cooldown check trong `QuizService.startQuiz()`
3. Thêm method `analyzeAnswerTiming()`
4. Thêm entity `SuspiciousAttempt` và method `flagAttempt()`
5. Tạo migration `V17__quiz_anti_cheat.sql`
6. Cập nhật `QuizSummaryResponse` thêm field `suspicious`

**Thay đổi Database cần thiết:**
- Bảng mới `quiz_attempt_flags` (nếu triển khai flagging)
- Cột mới `quiz_attempts.suspicious = BOOLEAN`
- Index mới cho truy vấn rate limiting

**Thay đổi API:**
- `POST /quizzes/{quizRef}/start` — có thể throw `QuizCooldownException`
- `POST /quizzes/submit` — thêm metadata payload tùy chọn
- `GET /admin/flagged-attempts` — endpoint admin mới
