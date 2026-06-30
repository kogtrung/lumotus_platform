package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.QuizAttempt;

import java.util.UUID;

public record QuizLeaderboardEntry(
    UUID userId,
    String username,
    Double bestScore,
    Integer totalAttempts,
    Integer bestCorrectAnswers,
    Integer bestTimeSeconds
) {
    public static QuizLeaderboardEntry from(QuizAttempt a, String username) {
        return new QuizLeaderboardEntry(
            a.getUser().getId(),
            username,
            a.getScore(),
            1,
            a.getCorrectAnswers(),
            a.getTimeTakenSeconds()
        );
    }
}
