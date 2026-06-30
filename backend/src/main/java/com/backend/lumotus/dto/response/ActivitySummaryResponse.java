package com.backend.lumotus.dto.response;

import java.util.List;

public record ActivitySummaryResponse(
        List<ActivityDayResponse> daily,
        int totalCards,
        int totalQuizzes,
        int totalXp,
        int activeDays
) {}
