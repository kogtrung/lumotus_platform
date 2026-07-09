package com.backend.lumotus.dto.response;

public record DashboardStatsResponse(
        int totalXp,
        int streak,
        int cardsLast7Days,
        int quizzesLast7Days,
        int xpLast7Days,
        int cardsToday,
        int quizzesToday,
        int xpToday,
        long totalMastered,
        long totalLearned
) {}
