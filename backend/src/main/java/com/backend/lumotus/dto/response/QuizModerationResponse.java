package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.Quiz;

import java.time.Instant;
import java.util.UUID;

public record QuizModerationResponse(
    UUID id,
    String title,
    String description,
    UUID deckId,
    String deckTitle,
    UUID ownerId,
    String ownerUsername,
    Instant createdAt,
    Integer attemptCount,
    Double avgScore,
    String quizType
) {
    public static QuizModerationResponse from(Quiz quiz) {
        return new QuizModerationResponse(
            quiz.getId(),
            quiz.getTitle(),
            quiz.getDescription(),
            quiz.getDeck() != null ? quiz.getDeck().getId() : null,
            quiz.getDeck() != null ? quiz.getDeck().getTitle() : null,
            quiz.getOwnerId(),
            quiz.getOwnerUsername(),
            quiz.getCreatedAt(),
            quiz.getAttemptCount(),
            quiz.getAvgScore(),
            quiz.getQuizType().name()
        );
    }
}
