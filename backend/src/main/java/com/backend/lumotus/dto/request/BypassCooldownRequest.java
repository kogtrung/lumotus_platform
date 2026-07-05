package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record BypassCooldownRequest(
        @NotNull UUID userId,
        @NotNull UUID quizId,
        Instant expiresAt,
        String reason
) {}
