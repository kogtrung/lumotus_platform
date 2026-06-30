package com.backend.lumotus.dto.response;

import java.util.List;

public record WeeklySummaryResponse(
        List<ActivityDayResponse> days,
        Totals thisWeek,
        Totals lastWeek
) {
    public record Totals(int cards, int quizzes, int xp) {}
}
