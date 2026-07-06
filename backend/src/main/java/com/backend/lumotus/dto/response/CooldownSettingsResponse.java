package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.QuizCooldownSettings;

import java.time.Instant;
import java.util.UUID;

public record CooldownSettingsResponse(
        UUID id,
        Boolean enabled,
        Integer minSecondsBetweenAttempts,
        Integer maxAttemptsPerQuizPerDay,
        Integer maxTotalAttemptsPerDay,
        Integer maxTotalAttemptsPerWeek,
        UUID bypassUserId,
        UUID bypassQuizId,
        Instant bypassExpiresAt,
        String bypassReason,
        Instant updatedAt
) {
    public static CooldownSettingsResponse from(QuizCooldownSettings s) {
        return new CooldownSettingsResponse(
                s.getId(),
                s.getEnabled(),
                s.getMinSecondsBetweenAttempts(),
                s.getMaxAttemptsPerQuizPerDay(),
                s.getMaxTotalAttemptsPerDay(),
                s.getMaxTotalAttemptsPerWeek(),
                s.getBypassUserId(),
                s.getBypassQuizId(),
                s.getBypassExpiresAt(),
                s.getBypassReason(),
                s.getUpdatedAt()
        );
    }
}
