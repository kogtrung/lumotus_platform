package com.backend.lumotus.dto.response;

import java.util.UUID;

/**
 * Global quiz leaderboard entry — aggregated quiz performance per user across ALL quizzes.
 * Ranked by average best score (avg_best_score).
 * Only counts quiz activity, does NOT include XP or streak from flashcard reviews.
 */
public record GlobalQuizLeaderboardEntry(
    UUID userId,
    String username,
    String avatarUrl,
    double avgBestScore,
    int quizzesCompleted,
    int totalCorrectAnswers,
    int totalTimeSeconds,
    long rank
) {}
