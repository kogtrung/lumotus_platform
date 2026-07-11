package com.backend.lumotus.dto.request;

import com.backend.lumotus.entity.ReviewRating;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BatchRateRequest(
        @NotEmpty List<ReviewItem> reviews
) {
    public record ReviewItem(
            @NotNull UUID cardId,
            @NotNull ReviewRating rating,
            @NotNull Instant ratedAt
    ) {}
}
