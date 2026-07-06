package com.backend.lumotus.dto.response;

public record AdminStatsResponse(
        long totalUsers,
        long totalDecks,
        long totalCards,
        long totalQuizzes,
        long totalActiveUsersToday,
        long totalReviewsToday,
        long totalXpAwardedToday
) {}
