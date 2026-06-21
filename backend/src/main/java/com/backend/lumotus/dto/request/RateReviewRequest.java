package com.backend.lumotus.dto.request;

import com.backend.lumotus.entity.ReviewRating;
import jakarta.validation.constraints.NotNull;

public record RateReviewRequest(@NotNull ReviewRating rating) {}
