package com.backend.lumotus.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuizResultResponse(
    UUID attemptId,
    UUID quizId,
    String quizTitle,
    Double score,
    Integer totalQuestions,
    Integer correctAnswers,
    Integer xpEarned,
    Integer timeTakenSeconds,
    Instant startedAt,
    Instant finishedAt,
    List<AnswerResultDetail> details
) {
    public static QuizResultResponse from(com.backend.lumotus.entity.QuizAttempt attempt, java.util.List<AnswerResultDetail> details) {
        return new QuizResultResponse(
            attempt.getId(),
            attempt.getQuiz() != null ? attempt.getQuiz().getId() : null,
            attempt.getQuiz() != null ? attempt.getQuiz().getTitle() : null,
            attempt.getScore(),
            attempt.getTotalQuestions(),
            attempt.getCorrectAnswers(),
            attempt.getXpEarned(),
            attempt.getTimeTakenSeconds(),
            attempt.getStartedAt(),
            attempt.getFinishedAt(),
            details
        );
    }
}
