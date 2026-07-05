package com.backend.lumotus.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Redis-backed quiz session store with auto-save support.
 *
 * Key patterns:
 * - quiz:session:{sessionId}           # Session metadata (attemptId, userId, startedAt, timeLimit)
 * - quiz:session:{sessionId}:answers   # Hash: questionId -> SessionAnswerData JSON
 * - quiz:session:{sessionId}:skipped   # Set: questionIds that were skipped/timeout
 * - quiz:session:{sessionId}:shuffle   # Hash: questionId -> shuffled option letters (e.g., "A,B,D,C")
 *
 * TTL: timeLimitSeconds + 5 min buffer, max 2 hours
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuizSessionService {

    private static final String SESSION_KEY_PREFIX = "quiz:session:";
    private static final String ANSWERS_KEY_SUFFIX = ":answers";
    private static final String SKIPPED_KEY_SUFFIX = ":skipped";
    private static final String USER_SESSIONS_KEY_PREFIX = "quiz:user-sessions:";

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ============================================================
    // SESSION MANAGEMENT
    // ============================================================

    /**
     * Store a quiz session after startQuiz().
     */
    public void startSession(String attemptId, String userId, Instant startedAt, Integer timeLimitSeconds) {
        String key = SESSION_KEY_PREFIX + attemptId;
        QuizSessionData data = new QuizSessionData(attemptId, userId, startedAt.getEpochSecond(), timeLimitSeconds);

        try {
            String json = objectMapper.writeValueAsString(data);
            Duration ttl = getSessionTtl(timeLimitSeconds);
            redis.opsForValue().set(key, json, ttl);

            // Track session for user
            redis.opsForSet().add(USER_SESSIONS_KEY_PREFIX + userId, attemptId);
            redis.expire(USER_SESSIONS_KEY_PREFIX + userId, ttl);

            log.debug("Started quiz session: attemptId={}, userId={}, startedAt={}, ttl={}s",
                    attemptId, userId, startedAt, ttl.getSeconds());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize quiz session: {}", attemptId, e);
        }
    }

    /**
     * Resume a session — returns remaining seconds based on server time.
     */
    public Optional<SessionResumeData> resumeSession(String attemptId, String userId) {
        String key = SESSION_KEY_PREFIX + attemptId;
        String json = redis.opsForValue().get(key);
        if (json == null) {
            return Optional.empty();
        }

        try {
            QuizSessionData data = objectMapper.readValue(json, QuizSessionData.class);

            if (!data.userId().equals(userId)) {
                return Optional.empty();
            }

            int remaining;
            if (data.timeLimitSeconds() == null || data.timeLimitSeconds() <= 0) {
                remaining = -1;
            } else {
                long elapsed = Instant.now().getEpochSecond() - data.startedAt();
                remaining = data.timeLimitSeconds() - (int) elapsed;
                if (remaining < 0) remaining = 0;
            }

            return Optional.of(new SessionResumeData(remaining, data.startedAt(), data.timeLimitSeconds()));
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize quiz session: {}", attemptId, e);
            return Optional.empty();
        }
    }

    /**
     * Heartbeat — extends TTL to keep session alive during active play.
     */
    public void extendSession(String attemptId, Integer timeLimitSeconds) {
        String key = SESSION_KEY_PREFIX + attemptId;
        Duration ttl = getSessionTtl(timeLimitSeconds);
        redis.expire(key, ttl);
    }

    /**
     * Invalidate session after submit or on explicit quit.
     */
    public void invalidateSession(String attemptId, String userId) {
        String key = SESSION_KEY_PREFIX + attemptId;
        redis.delete(key);
        redis.delete(key + ANSWERS_KEY_SUFFIX);
        redis.delete(key + SKIPPED_KEY_SUFFIX);

        if (userId != null) {
            redis.opsForSet().remove(USER_SESSIONS_KEY_PREFIX + userId, attemptId);
        }
        log.debug("Invalidated quiz session: {}", attemptId);
    }

    /**
     * Enforce time limit server-side during submit.
     */
    public boolean validateTimeLimit(String attemptId, String userId, Integer submittedTimeTakenSeconds) {
        Optional<SessionResumeData> opt = resumeSession(attemptId, userId);
        if (opt.isEmpty()) {
            return true;
        }

        SessionResumeData session = opt.get();
        if (session.timeLimitSeconds() == null || session.timeLimitSeconds() <= 0) {
            return true;
        }

        if (session.startedAtEpochSecond() > 0) {
            long elapsed = Instant.now().getEpochSecond() - session.startedAtEpochSecond();
            if (elapsed > session.timeLimitSeconds() + 10) {
                log.warn("Quiz session expired: attemptId={}, elapsed={}s, limit={}s",
                        attemptId, elapsed, session.timeLimitSeconds());
                return false;
            }
        }

        return true;
    }

    public boolean isSessionExpired(String attemptId, String userId) {
        String key = SESSION_KEY_PREFIX + attemptId;
        String json = redis.opsForValue().get(key);
        if (json == null) {
            return true;
        }

        try {
            QuizSessionData data = objectMapper.readValue(json, QuizSessionData.class);
            if (!data.userId().equals(userId)) {
                return true;
            }
            if (data.timeLimitSeconds() == null || data.timeLimitSeconds() <= 0) {
                return false;
            }
            long elapsed = Instant.now().getEpochSecond() - data.startedAt();
            return elapsed > data.timeLimitSeconds();
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize quiz session: {}", attemptId, e);
            return true;
        }
    }

    public List<String> getActiveSessionIds(String userId) {
        var sessionIds = redis.opsForSet().members(USER_SESSIONS_KEY_PREFIX + userId);
        if (sessionIds == null || sessionIds.isEmpty()) {
            return Collections.emptyList();
        }
        return sessionIds.stream()
                .filter(id -> Boolean.TRUE.equals(redis.hasKey(SESSION_KEY_PREFIX + id)))
                .collect(Collectors.toList());
    }

    public void expireAllActiveSessions(String userId) {
        List<String> activeSessionIds = getActiveSessionIds(userId);
        for (String attemptId : activeSessionIds) {
            invalidateSession(attemptId, userId);
        }
        if (!activeSessionIds.isEmpty()) {
            log.info("Expired {} active quiz sessions for userId={}", activeSessionIds.size(), userId);
        }
    }

    // ============================================================
    // AUTO-SAVE ANSWERS
    // ============================================================

    /**
     * Auto-save an answer to Redis.
     * Called on each answer selection (debounced from frontend).
     */
    public void saveAnswer(String attemptId, String questionId, String answer, Instant answeredAt) {
        String answersKey = SESSION_KEY_PREFIX + attemptId + ANSWERS_KEY_SUFFIX;

        SessionAnswerData answerData = new SessionAnswerData(answer, answeredAt.getEpochSecond());

        try {
            String json = objectMapper.writeValueAsString(answerData);
            redis.opsForHash().put(answersKey, questionId, json);

            // Extend TTL with session TTL
            String sessionKey = SESSION_KEY_PREFIX + attemptId;
            String ttlStr = redis.opsForValue().get(sessionKey + ":ttl");
            if (ttlStr != null) {
                long ttl = Long.parseLong(ttlStr);
                redis.expire(answersKey, Duration.ofSeconds(ttl));
            } else {
                redis.expire(answersKey, Duration.ofHours(2));
            }

            log.debug("Saved answer: attemptId={}, questionId={}", attemptId, questionId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize answer: attemptId={}, questionId={}", attemptId, questionId, e);
        }
    }

    /**
     * Get all answers for a session from Redis.
     */
    public Map<String, SessionAnswerData> getSessionAnswers(String attemptId) {
        String answersKey = SESSION_KEY_PREFIX + attemptId + ANSWERS_KEY_SUFFIX;
        Map<Object, Object> entries = redis.opsForHash().entries(answersKey);

        Map<String, SessionAnswerData> result = new HashMap<>();
        for (Map.Entry<Object, Object> entry : entries.entrySet()) {
            try {
                String questionId = entry.getKey().toString();
                SessionAnswerData data = objectMapper.readValue(entry.getValue().toString(), SessionAnswerData.class);
                result.put(questionId, data);
            } catch (JsonProcessingException e) {
                log.error("Failed to deserialize answer data", e);
            }
        }
        return result;
    }

    /**
     * Sync offline answers when coming back online.
     */
    public void syncAnswers(String attemptId, List<OfflineAnswer> answers) {
        String answersKey = SESSION_KEY_PREFIX + attemptId + ANSWERS_KEY_SUFFIX;

        for (OfflineAnswer offlineAnswer : answers) {
            try {
                SessionAnswerData data = new SessionAnswerData(
                        offlineAnswer.answer(),
                        offlineAnswer.answeredAt() != null ? offlineAnswer.answeredAt() : Instant.now().getEpochSecond()
                );
                String json = objectMapper.writeValueAsString(data);
                redis.opsForHash().put(answersKey, offlineAnswer.questionId(), json);
            } catch (JsonProcessingException e) {
                log.error("Failed to sync offline answer: questionId={}", offlineAnswer.questionId(), e);
            }
        }

        log.info("Synced {} offline answers for attemptId={}", answers.size(), attemptId);
    }

    /**
     * Mark a question as skipped (timeout).
     * Only marks as skipped if NO answer was saved.
     * If an answer exists, keeps the answer (do NOT delete it).
     */
    public void markQuestionSkipped(String attemptId, String questionId) {
        String answersKey = SESSION_KEY_PREFIX + attemptId + ANSWERS_KEY_SUFFIX;
        
        // Only mark as skipped if no answer was saved
        Object existingAnswer = redis.opsForHash().get(answersKey, questionId);
        if (existingAnswer != null) {
            // Answer exists - don't overwrite with skip, keep the answer
            log.debug("Answer already saved, not marking skipped: attemptId={}, questionId={}", attemptId, questionId);
            return;
        }
        
        // No answer saved - mark as skipped
        String skippedKey = SESSION_KEY_PREFIX + attemptId + SKIPPED_KEY_SUFFIX;
        redis.opsForSet().add(skippedKey, questionId);

        log.debug("Marked question skipped: attemptId={}, questionId={}", attemptId, questionId);
    }

    /**
     * Get all skipped question IDs for a session.
     */
    public Set<String> getSkippedQuestions(String attemptId) {
        String skippedKey = SESSION_KEY_PREFIX + attemptId + SKIPPED_KEY_SUFFIX;
        var members = redis.opsForSet().members(skippedKey);
        return members != null ? new HashSet<>(members) : Collections.emptySet();
    }

    /**
     * Clear skipped marker when user answers a skipped question.
     */
    public void unmarkQuestionSkipped(String attemptId, String questionId) {
        String skippedKey = SESSION_KEY_PREFIX + attemptId + SKIPPED_KEY_SUFFIX;
        redis.opsForSet().remove(skippedKey, questionId);
    }

    // ============================================================
    // SHUFFLE OPTIONS MAPPING
    // ============================================================

    private static final String SHUFFLE_KEY_SUFFIX = ":shuffle";
    private static final String QUESTION_ORDER_KEY_SUFFIX = ":question_order";

    /**
     * Store the shuffle mapping for a session.
     * @param attemptId The attempt ID
     * @param questionId The question ID
     * @param shuffleOrder Comma-separated letters representing shuffled order, e.g., "B,D,A,C"
     *                      where index 0 is position A, index 1 is position B, etc.
     */
    public void setQuestionShuffle(String attemptId, String questionId, String shuffleOrder) {
        String shuffleKey = SESSION_KEY_PREFIX + attemptId + SHUFFLE_KEY_SUFFIX;
        redis.opsForHash().put(shuffleKey, questionId, shuffleOrder);
        redis.expire(shuffleKey, Duration.ofHours(2));
        log.debug("Set shuffle for question: attemptId={}, questionId={}, shuffle={}", attemptId, questionId, shuffleOrder);
    }

    /**
     * Store shuffle mappings for all questions in a session.
     */
    public void setQuestionShuffles(String attemptId, Map<String, String> shuffles) {
        if (shuffles == null || shuffles.isEmpty()) return;
        String shuffleKey = SESSION_KEY_PREFIX + attemptId + SHUFFLE_KEY_SUFFIX;
        Map<String, String> hash = new java.util.HashMap<>(shuffles);
        redis.opsForHash().putAll(shuffleKey, hash);
        redis.expire(shuffleKey, Duration.ofHours(2));
        log.debug("Set {} shuffle mappings for attemptId={}", shuffles.size(), attemptId);
    }

    /**
     * Get the shuffle mapping for a specific question.
     * @param attemptId The attempt ID
     * @param questionId The question ID
     * @return The shuffle order string, or null if not found
     */
    public String getQuestionShuffle(String attemptId, String questionId) {
        String shuffleKey = SESSION_KEY_PREFIX + attemptId + SHUFFLE_KEY_SUFFIX;
        Object value = redis.opsForHash().get(shuffleKey, questionId);
        return value != null ? value.toString() : null;
    }

    /**
     * Get all shuffle mappings for a session.
     * @return Map of questionId -> shuffle order
     */
    public Map<String, String> getAllQuestionShuffles(String attemptId) {
        String shuffleKey = SESSION_KEY_PREFIX + attemptId + SHUFFLE_KEY_SUFFIX;
        Map<Object, Object> entries = redis.opsForHash().entries(shuffleKey);
        Map<String, String> result = new java.util.HashMap<>();
        for (Map.Entry<Object, Object> entry : entries.entrySet()) {
            result.put(entry.getKey().toString(), entry.getValue().toString());
        }
        return result;
    }

    /**
     * Convert user-selected position (A/B/C/D) to original option index (0-3).
     * @param shuffleOrder The shuffle order string, e.g., "B,D,A,C"
     * @param selectedPosition The position the user selected, e.g., "A" (displayed as first option)
     * @return The original option index (0-3), or -1 if not found
     */
    public int convertPositionToOriginalIndex(String shuffleOrder, String selectedPosition) {
        if (shuffleOrder == null || selectedPosition == null) return -1;
        String[] letters = shuffleOrder.split(",");
        for (int i = 0; i < letters.length; i++) {
            if (letters[i].equals(selectedPosition)) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Get the original correct answer letter (A/B/C/D) from the question.
     * @param originalOptions The original options array
     * @param correctAnswer The correct answer text
     * @return The letter A/B/C/D, or null
     */
    public String getOriginalCorrectLetter(List<String> originalOptions, String correctAnswer) {
        if (originalOptions == null || correctAnswer == null) return null;
        for (int i = 0; i < originalOptions.size(); i++) {
            if (normalize(originalOptions.get(i)).equals(normalize(correctAnswer))) {
                return String.valueOf((char) ('A' + i));
            }
        }
        return null;
    }

    private String normalize(String s) {
        if (s == null) return "";
        return s.trim().toLowerCase();
    }

    // ============================================================
    // SHUFFLED QUESTION ORDER
    // ============================================================

    /**
     * Store the shuffled question order for a session.
     * @param attemptId The attempt ID
     * @param questionIds Ordered list of question IDs as they were shuffled for this user
     */
    public void setQuestionOrder(String attemptId, List<String> questionIds) {
        String orderKey = SESSION_KEY_PREFIX + attemptId + QUESTION_ORDER_KEY_SUFFIX;
        // Store as a list using Redis List operations
        redis.delete(orderKey);
        for (String qId : questionIds) {
            redis.opsForList().rightPush(orderKey, qId);
        }
        redis.expire(orderKey, Duration.ofHours(2));
        log.debug("Set question order for attemptId={}: {} questions", attemptId, questionIds.size());
    }

    /**
     * Get the shuffled question order for a session.
     * @param attemptId The attempt ID
     * @return Ordered list of question IDs, or null if not found
     */
    public List<String> getQuestionOrder(String attemptId) {
        String orderKey = SESSION_KEY_PREFIX + attemptId + QUESTION_ORDER_KEY_SUFFIX;
        List<String> order = redis.opsForList().range(orderKey, 0, -1);
        return order != null ? order : Collections.emptyList();
    }

    // ============================================================
    // VALIDATION
    // ============================================================

    /**
     * Validate that a session belongs to the given user.
     */
    public boolean validateSessionOwnership(String attemptId, String userId) {
        String key = SESSION_KEY_PREFIX + attemptId;
        String json = redis.opsForValue().get(key);
        if (json == null) {
            return false;
        }

        try {
            QuizSessionData data = objectMapper.readValue(json, QuizSessionData.class);
            return data.userId().equals(userId);
        } catch (JsonProcessingException e) {
            return false;
        }
    }

    // ============================================================
    // INTERNAL HELPERS
    // ============================================================

    private Duration getSessionTtl(Integer timeLimitSeconds) {
        if (timeLimitSeconds != null && timeLimitSeconds > 0) {
            return Duration.ofSeconds(timeLimitSeconds + 300); // +5 min buffer
        }
        return Duration.ofHours(2); // No time limit: 2h TTL
    }

    // ============================================================
    // RECORDS
    // ============================================================

    private record QuizSessionData(
            String attemptId,
            String userId,
            long startedAt,
            Integer timeLimitSeconds
    ) {}

    public record SessionResumeData(
            int remainingSeconds,
            long startedAtEpochSecond,
            Integer timeLimitSeconds
    ) {}

    public record SessionAnswerData(
            String answer,
            long answeredAtEpochSecond
    ) {}

    public record OfflineAnswer(
            String questionId,
            String answer,
            Long answeredAt
    ) {}
}
