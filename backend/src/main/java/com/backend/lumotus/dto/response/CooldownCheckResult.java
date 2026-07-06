package com.backend.lumotus.dto.response;

import java.time.Instant;
import java.util.UUID;

public record CooldownCheckResult(
        UUID quizId,
        boolean allowed,
        CooldownViolationType violation,
        String message,
        Instant cooldownEndsAt,
        int secondsUntilCooldownEnds,
        Integer attemptsUsed,
        Integer attemptsLimit
) {
    public enum CooldownViolationType {
        NONE,
        COOLDOWN_PERIOD,         // Too soon since last attempt
        DAILY_QUIZ_LIMIT,         // Max attempts per quiz per day reached
        DAILY_TOTAL_LIMIT,       // Max total attempts per day reached
        WEEKLY_TOTAL_LIMIT,      // Max total attempts per week reached
        GLOBAL_DISABLED          // Cooldown system disabled
    }

    public static CooldownCheckResult allowed(UUID quizId) {
        return new CooldownCheckResult(quizId, true, CooldownViolationType.NONE,
                null, null, 0, null, null);
    }

    public static CooldownCheckResult violation(UUID quizId, CooldownViolationType violation,
            String message, Instant cooldownEndsAt, int secondsUntil,
            Integer attemptsUsed, Integer attemptsLimit) {
        return new CooldownCheckResult(quizId, false, violation,
                message, cooldownEndsAt, secondsUntil, attemptsUsed, attemptsLimit);
    }
}
