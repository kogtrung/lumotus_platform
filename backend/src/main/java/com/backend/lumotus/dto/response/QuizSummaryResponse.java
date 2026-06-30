package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.Quiz;

import java.time.Instant;
import java.util.UUID;

public record QuizSummaryResponse(
    UUID id,
    String title,
    String description,
    String coverImageUrl,
    UUID deckId,
    String deckTitle,
    UUID ownerId,
    String ownerUsername,
    Boolean isPublic,
    String status,
    String rejectionNote,
    Integer timeLimitSeconds,
    Integer questionCount,
    Integer attemptCount,
    Double avgScore,
    Instant createdAt,
    String quizType,
    Boolean isImmutable
) {
    public static QuizSummaryResponse from(Quiz quiz) {
        return new QuizSummaryResponse(
            quiz.getId(),
            quiz.getTitle(),
            quiz.getDescription(),
            quiz.getCoverImageUrl(),
            quiz.getDeck() != null ? quiz.getDeck().getId() : null,
            quiz.getDeck() != null ? quiz.getDeck().getTitle() : null,
            quiz.getOwnerId(),
            quiz.getOwnerUsername(),
            quiz.getIsPublic(),
            quiz.getStatus().name(),
            quiz.getRejectionNote(),
            quiz.getTimeLimitSeconds(),
            quiz.getQuestionCount(),
            quiz.getAttemptCount(),
            quiz.getAvgScore(),
            quiz.getCreatedAt(),
            quiz.getQuizType().name(),
            quiz.getIsImmutable()
        );
    }
}
