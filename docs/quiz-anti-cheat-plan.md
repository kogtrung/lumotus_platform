# Quiz Anti-Cheat & Fraud Prevention Plan

> **Document Type:** Technical Design  
> **Status:** Planning  
> **Last Updated:** 2026-07-02

---

## 1. Current State Analysis

### What's Working ✅
- Server-side answer validation (never trust client)
- Quiz attempt ownership verification
- Redis-backed session timer (prevents client clock manipulation)
- Best-attempt deduplication for leaderboard (only counts highest score per user)
- Session resume from Redis
- Duplicate submit prevention

### Vulnerabilities ❌

| # | Vulnerability | Severity | Impact |
|---|-------------|----------|--------|
| 1 | No rate limiting on quiz start | HIGH | Users can spam start quiz sessions |
| 2 | No attempt cooldown | HIGH | Users can grind leaderboard with many attempts |
| 3 | No bot-like behavior detection | MEDIUM | Suspiciously fast answers (< 2s per question) |
| 4 | No browser/tab focus tracking | MEDIUM | Cannot detect multi-tasking cheating |
| 5 | Full questions sent upfront | MEDIUM | Sophisticated cheaters can scrape all answers |
| 6 | No IP-based rate limiting | MEDIUM | Multi-account abuse possible |
| 7 | No captcha after failures | MEDIUM | Brute force on answers |
| 8 | Client-side answer caching | LOW | localStorage stores correct answers (though not displayed) |

---

## 2. Proposed Anti-Cheat Measures

### 2.1 Rate Limiting & Cooldown (Priority: HIGH)

#### Quiz Attempt Cooldown
```java
// New table: quiz_attempt_cooldown
// user_id | quiz_id | last_attempt_at | attempt_count (today)
```

**Rules:**
- User can start max **5 attempts** per quiz per day
- Minimum **10 minutes** cooldown between attempts on same quiz
- Cooldown resets at midnight UTC

**Implementation:**
```java
// In QuizAttemptRepository
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

#### Global Attempt Limits
- Max **20 quiz attempts** per day across all quizzes
- Max **50 quiz attempts** per week

### 2.2 Bot Detection - Answer Timing Analysis (Priority: HIGH)

#### Answer Velocity Check
```java
public record AnswerTiming(
    String questionId,
    Instant answeredAt,
    int timeFromStart  // seconds
) {}

public record SuspiciousPattern(
    boolean tooFast,      // < 2s average per question
    boolean tooConsistent, // variance < 0.5s (robotic)
    boolean tooPerfect     // 100% correct with < 3s avg
) {}
```

**Rules:**
- Flag if average time per question < 2 seconds consistently
- Flag if answer timing variance < 0.5s (too robotic)
- Flag if 100% perfect score with suspiciously fast answers
- Flagged attempts don't count for leaderboard but still record

**Implementation:**
```java
// In QuizService.submitQuiz()
private SuspiciousPattern analyzeAnswerTiming(
    List<AnswerSubmission> answers,
    int totalQuestions,
    int correctAnswers,
    int timeTakenSeconds
) {
    // Calculate average time per question
    double avgTimePerQuestion = (double) timeTakenSeconds / totalQuestions;

    // Check if too fast
    boolean tooFast = avgTimePerQuestion < 2.0;

    // Calculate variance of answer intervals (simplified)
    boolean tooConsistent = calculateVariance(answerTimings) < 0.5;

    // Perfect score + too fast = suspicious
    boolean tooPerfect = correctAnswers == totalQuestions && avgTimePerQuestion < 3.0;

    return new SuspiciousPattern(tooFast, tooConsistent, tooPerfect);
}
```

### 2.3 Browser/Tab Focus Detection (Priority: MEDIUM)

#### Frontend Tracking
```typescript
// In QuizPlayPage.tsx
interface FocusEvent {
  event: 'focus' | 'blur' | 'visibility_hidden' | 'tab_switch'
  timestamp: number
  duration?: number  // for blur events
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

**Submission Payload:**
```typescript
interface SubmitQuizPayload {
  attemptId: string
  answers: Answer[]
  timeTakenSeconds: number
  metadata?: {
    focusLossCount: number      // Number of times tab was hidden
    totalFocusLossDuration: number  // Total seconds away from tab
    suspicious: boolean         // Client-side flag (informational only)
  }
}
```

**Server-side:**
- Log focus loss events for audit
- Flag attempts with > 5 focus losses or > 30s total away time
- Flagged attempts shown in admin dashboard

### 2.4 IP-Based Rate Limiting (Priority: MEDIUM)

**Implementation:** Use Redis for distributed rate limiting

```java
// Redis key patterns
quiz:rate:ip:{ipAddress}:day     // Daily attempts per IP
quiz:rate:ip:{ipAddress}:hour     // Hourly attempts per IP

// Limits
- Max 50 attempts per IP per hour
- Max 200 attempts per IP per day
- Max 5 different users from same IP per hour (detects multi-account)
```

### 2.5 Question Delivery Isolation (Priority: MEDIUM)

**Current:** All questions sent upfront at quiz start

**Proposed:** Progressive question delivery (for high-stakes quizzes)

```java
// Option A: Progressive delivery (more secure)
@PostMapping("/{quizRef}/question/next")
public ResponseEntity<QuestionDeliveryResponse> getNextQuestion(
    @AuthenticationPrincipal UserPrincipal principal,
    @PathVariable String quizRef,
    @RequestBody QuestionRequest request  // { attemptId, previousQuestionId }
) {
    // Server fetches next question, never sends all at once
    // More complex, but more secure
}

// Option B: Hash-based verification (simpler)
@PostMapping("/{quizRef}/verify")
public ResponseEntity<VerificationResponse> verifyQuizIntegrity(
    @AuthenticationPrincipal UserPrincipal principal,
    @RequestBody VerificationRequest request  // { attemptId, clientHash }
) {
    // Client sends hash of received questions
    // Server compares with expected hash
    // Mismatch = cheating detected
}
```

**Recommendation:** Implement Option B (hash verification) first - less complex, good deterrent.

### 2.6 Admin Moderation & Review (Priority: MEDIUM)

#### Flagged Attempts Dashboard
```sql
-- New table: quiz_attempt_flags
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

#### Quiz Quality Checks (on submission)
```java
// Before publishing to Explore, verify quiz quality
public record QuizQualityCheck(
    boolean hasMinQuestions,      // >= 5 questions
    boolean hasNoDuplicateAnswers, // No same answer for multiple questions
    boolean hasValidOptions,      // At least 2 options for MCQ
    boolean hasNoProfanity,       // No profanity in questions
    boolean hasReasonableDifficulty // Not too easy/hard
) {}
```

---

## 3. Implementation Phases

### Phase 1: Immediate (Quick Wins)
- [ ] Add quiz attempt cooldown (10 min between same quiz)
- [ ] Add daily attempt limit (5 per quiz, 20 per day total)
- [ ] Add answer timing analysis
- [ ] Add flagging for suspicious patterns

### Phase 2: Medium Term
- [ ] Implement IP-based rate limiting with Redis
- [ ] Add browser focus tracking
- [ ] Create admin flagged attempts dashboard
- [ ] Add hash-based integrity verification

### Phase 3: Advanced (Future)
- [ ] Progressive question delivery
- [ ] CAPTCHA after consecutive failures
- [ ] ML-based anomaly detection
- [ ] Real-time monitoring dashboard

---

## 4. User-Submitted Quiz Moderation

### Quality Gates for Publishing

```java
public record ModerationChecklist(
    boolean passed,
    List<String> issues,
    List<String> warnings
) {}

// Requirements for APPROVED status:
- Minimum 5 questions
- No duplicate correct answers
- At least 2 wrong options per MCQ
- No profanity detected
- At least 3 different users have attempted
- Average score between 20% and 95% (not too easy/hard)
```

### Automated Content Review
```java
// Simple profanity filter
private static final Set<String> PROFANITY_LIST = Set.of(
    "badword1", "badword2" // expandable
);

// Check each question
public boolean containsProfanity(String text) {
    String lower = text.toLowerCase();
    return PROFANITY_LIST.stream().anyMatch(lower::contains);
}
```

---

## 5. Monitoring & Alerts

### Redis Keys for Monitoring
```
quiz:monitor:daily_attempts    // Counter for daily attempts
quiz:monitor:flagged_attempts   // Counter for flagged attempts
quiz:monitor:suspicious_ips     // Set of flagged IPs
```

### Alert Thresholds
- > 100 attempts/hour from single IP → Alert + auto-block
- > 50% attempts flagged as suspicious → Review anti-cheat rules
- New quiz with > 100% pass rate → Flag for review

---

## 6. False Positive Handling

### User Appeal Process
1. User sees "attempt flagged" message
2. User can request review via support
3. Admin reviews timing data + answers
4. Admin can confirm (invalid score) or dismiss (restore to leaderboard)

### Graduated Response
| Offense | First | Second | Third+ |
|---------|-------|--------|--------|
| Fast answers | Warning | 24h ban | 7d ban |
| Multi-account | 1h ban | 24h ban | Permanent |
| Scraping | IP block 1h | IP block 24h | IP block permanent |

---

## 7. Technical Notes

### Redis Rate Limiting Pattern
```java
// Using Redis INCR with TTL
public boolean checkRateLimit(String key, int maxAttempts, Duration window) {
    Long count = redis.opsForValue().increment(key);
    if (count == 1) {
        redis.expire(key, window);
    }
    return count <= maxAttempts;
}
```

### Database Index for Anti-Cheat Queries
```sql
-- Fast lookup for rate limiting
CREATE INDEX idx_quiz_attempts_user_quiz_day
ON quiz_attempts(user_id, quiz_id, started_at DESC)
WHERE started_at > NOW() - INTERVAL '1 day';
```

---

## 8. Summary

**Phase 1 Implementation Checklist:**
1. Add `countRecentAttempts` and `findLastAttemptTime` to `QuizAttemptRepository`
2. Add cooldown check in `QuizService.startQuiz()`
3. Add `analyzeAnswerTiming()` method
4. Add `SuspiciousAttempt` entity and `flagAttempt()` method
5. Create migration `V17__quiz_anti_cheat.sql`
6. Update `QuizSummaryResponse` to include `suspicious` flag

**Database Changes Required:**
- New table `quiz_attempt_flags` (if flagging implemented)
- New column `quiz_attempts.suspicious = BOOLEAN`
- New index for rate limiting queries

**API Changes:**
- `POST /quizzes/{quizRef}/start` - may throw `QuizCooldownException`
- `POST /quizzes/submit` - add optional metadata payload
- `GET /admin/flagged-attempts` - new admin endpoint
