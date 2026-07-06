package com.backend.lumotus.dto.response;

import com.backend.lumotus.dto.response.CooldownCheckResult.CooldownViolationType;

import java.time.Instant;
import java.util.UUID;

/**
 * Error response when a quiz start is blocked by cooldown rules.
 * Returns 429 Too Many Requests.
 */
public record CooldownApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        CooldownViolationType violation,
        UUID quizId,
        Instant cooldownEndsAt,
        int secondsUntilCooldownEnds,
        Integer attemptsUsed,
        Integer attemptsLimit
) {
    public static CooldownApiError from(CooldownCheckResult result, String path) {
        return new CooldownApiError(
                Instant.now(),
                429,
                "Too Many Requests",
                result.message(),
                path,
                result.violation(),
                result.quizId(),
                result.cooldownEndsAt(),
                result.secondsUntilCooldownEnds(),
                result.attemptsUsed(),
                result.attemptsLimit()
        );
    }
}
