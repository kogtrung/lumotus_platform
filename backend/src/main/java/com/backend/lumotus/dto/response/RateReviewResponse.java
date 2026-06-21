package com.backend.lumotus.dto.response;

import java.time.Instant;
import java.util.UUID;

public record RateReviewResponse(
        UUID cardId,
        int repetitions,
        float easeFactor,
        int intervalDays,
        Instant nextReviewAt,
        int xpEarned) {}
