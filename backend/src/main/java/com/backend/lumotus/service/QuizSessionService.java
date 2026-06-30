package com.backend.lumotus.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Redis-backed quiz session store.
 *
 * Persists quiz attempt start time so that:
 * - Timer survives page refresh / tab close (resume from server time)
 * - Server-side time enforcement prevents cheating
 *
 * Key pattern: quiz:session:{attemptId}
 * TTL: timeLimitSeconds + 5 min buffer
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class QuizSessionService {

    private static final String SESSION_KEY_PREFIX = "quiz:session:";
    private static final String USER_SESSIONS_KEY_PREFIX = "quiz:user-sessions:";

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Store a quiz session after startQuiz().
     * Stores: attemptId, userId, startedAt (epoch seconds), timeLimitSeconds.
     */
    public void startSession(String attemptId, String userId, Instant startedAt, Integer timeLimitSeconds) {
        String key = SESSION_KEY_PREFIX + attemptId;
        QuizSessionData data = new QuizSessionData(attemptId, userId, startedAt.getEpochSecond(), timeLimitSeconds);

        try {
            String json = objectMapper.writeValueAsString(data);
            Duration ttl;
            if (timeLimitSeconds != null && timeLimitSeconds > 0) {
                ttl = Duration.ofSeconds(timeLimitSeconds + 300); // +5 min buffer
            } else {
                ttl = Duration.ofHours(2); // no time limit: 2h TTL
            }
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
     * Returns empty if session expired / not found.
     */
    public Optional<SessionResumeData> resumeSession(String attemptId, String userId) {
        String key = SESSION_KEY_PREFIX + attemptId;
        String json = redis.opsForValue().get(key);
        if (json == null) {
            return Optional.empty();
        }

        try {
            QuizSessionData data = objectMapper.readValue(json, QuizSessionData.class);

            // Ownership check
            if (!data.userId().equals(userId)) {
                return Optional.empty();
            }

            int remaining;
            if (data.timeLimitSeconds() == null || data.timeLimitSeconds() <= 0) {
                remaining = -1; // no limit
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
        Duration ttl;
        if (timeLimitSeconds != null && timeLimitSeconds > 0) {
            ttl = Duration.ofSeconds(timeLimitSeconds + 300);
        } else {
            ttl = Duration.ofHours(2);
        }
        redis.expire(key, ttl);
    }

    /**
     * Invalidate session after submit or on explicit quit.
     */
    public void invalidateSession(String attemptId, String userId) {
        String key = SESSION_KEY_PREFIX + attemptId;
        redis.delete(key);
        if (userId != null) {
            redis.opsForSet().remove(USER_SESSIONS_KEY_PREFIX + userId, attemptId);
        }
        log.debug("Invalidated quiz session: {}", attemptId);
    }

    /**
     * Enforce time limit server-side during submit.
     * Returns false if time expired (cheating attempt).
     */
    public boolean validateTimeLimit(String attemptId, String userId, Integer submittedTimeTakenSeconds) {
        Optional<SessionResumeData> opt = resumeSession(attemptId, userId);
        if (opt.isEmpty()) {
            // No session in Redis — allow submit (timer was optional or already expired)
            return true;
        }

        SessionResumeData session = opt.get();
        if (session.timeLimitSeconds() == null || session.timeLimitSeconds() <= 0) {
            return true; // no time limit
        }

        // Check if they submitted after time expired
        if (session.startedAtEpochSecond() > 0) {
            long elapsed = Instant.now().getEpochSecond() - session.startedAtEpochSecond();
            if (elapsed > session.timeLimitSeconds() + 10) { // 10s grace
                log.warn("Quiz session expired: attemptId={}, elapsed={}s, limit={}s",
                        attemptId, elapsed, session.timeLimitSeconds());
                return false;
            }
        }

        return true;
    }

    // ─── Internal records ────────────────────────────────────────

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

    /**
     * Get all active session IDs for a user.
     * Returns attempt IDs whose Redis session keys still exist (not expired).
     */
    public List<String> getActiveSessionIds(String userId) {
        var sessionIds = redis.opsForSet().members(USER_SESSIONS_KEY_PREFIX + userId);
        if (sessionIds == null || sessionIds.isEmpty()) {
            return Collections.emptyList();
        }
        return sessionIds.stream()
                .filter(id -> Boolean.TRUE.equals(redis.hasKey(SESSION_KEY_PREFIX + id)))
                .collect(Collectors.toList());
    }
}
