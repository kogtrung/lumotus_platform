package com.backend.lumotus.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AdminStatsResponse(
        long totalUsers,
        long totalDecks,
        long totalCards,
        long totalQuizzes,
        long totalActiveUsersToday,
        long totalReviewsToday,
        long totalXpAwardedToday
) {}
