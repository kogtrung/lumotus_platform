package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateCooldownSettingsRequest(
        @NotNull(message = "enabled is required") Boolean enabled,
        @NotNull(message = "minSecondsBetweenAttempts is required")
        @Min(value = 1, message = "minSecondsBetweenAttempts must be at least 1 second") Integer minSecondsBetweenAttempts,
        @NotNull(message = "maxAttemptsPerQuizPerDay is required")
        @Min(value = 1, message = "maxAttemptsPerQuizPerDay must be at least 1") Integer maxAttemptsPerQuizPerDay,
        @NotNull(message = "maxTotalAttemptsPerDay is required")
        @Min(value = 1, message = "maxTotalAttemptsPerDay must be at least 1") Integer maxTotalAttemptsPerDay,
        @NotNull(message = "maxTotalAttemptsPerWeek is required")
        @Min(value = 1, message = "maxTotalAttemptsPerWeek must be at least 1") Integer maxTotalAttemptsPerWeek
) {}
