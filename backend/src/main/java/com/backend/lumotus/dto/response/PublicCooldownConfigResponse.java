package com.backend.lumotus.dto.response;

public record PublicCooldownConfigResponse(
        Boolean enabled,
        Integer minSecondsBetweenAttempts,
        Integer maxAttemptsPerQuizPerDay,
        Integer maxTotalAttemptsPerDay,
        Integer maxTotalAttemptsPerWeek
) {
}
