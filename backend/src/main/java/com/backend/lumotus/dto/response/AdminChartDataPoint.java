package com.backend.lumotus.dto.response;

import java.time.LocalDate;

/**
 * DTO representing daily activity metrics for admin charts.
 */
public record AdminChartDataPoint(
    LocalDate date,
    long newUsers,
    long newDecks,
    long quizAttempts
) {}
