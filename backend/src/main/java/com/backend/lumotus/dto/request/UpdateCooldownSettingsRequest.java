package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record UpdateCooldownSettingsRequest(
        @NotNull Boolean enabled,
        @Min(60) Integer minSecondsBetweenAttempts,
        @Min(1) Integer maxAttemptsPerQuizPerDay,
        @Min(1) Integer maxTotalAttemptsPerDay,
        @Min(1) Integer maxTotalAttemptsPerWeek
) {}
