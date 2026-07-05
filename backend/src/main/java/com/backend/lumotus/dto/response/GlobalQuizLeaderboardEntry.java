package com.backend.lumotus.dto.response;

import java.util.UUID;

/**
 * Global quiz leaderboard entry — aggregated performance across ALL quizzes.
 * Ranked by composite score: totalBestScore * 1000 + totalCorrectAnswers.
 */
public record GlobalQuizLeaderboardEntry(
    UUID userId,
    String username,
    String avatarUrl,
    double avgBestScore,
    int totalAttempts,
    int totalCorrectAnswers,
    int totalTimeSeconds,
    long rank
) {}
