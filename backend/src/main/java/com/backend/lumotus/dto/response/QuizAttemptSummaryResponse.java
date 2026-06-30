package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.QuizAttempt;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuizAttemptSummaryResponse(
    UUID attemptId,
    UUID quizId,
    String quizTitle,
    Double score,
    Integer totalQuestions,
    Integer correctAnswers,
    Integer xpEarned,
    Integer timeTakenSeconds,
    Instant startedAt,
    Instant finishedAt
) {
    public static QuizAttemptSummaryResponse from(QuizAttempt attempt) {
        return new QuizAttemptSummaryResponse(
            attempt.getId(),
            attempt.getQuiz() != null ? attempt.getQuiz().getId() : null,
            attempt.getQuiz() != null ? attempt.getQuiz().getTitle() : null,
            attempt.getScore(),
            attempt.getTotalQuestions(),
            attempt.getCorrectAnswers(),
            attempt.getXpEarned(),
            attempt.getTimeTakenSeconds(),
            attempt.getStartedAt(),
            attempt.getFinishedAt()
        );
    }
}
