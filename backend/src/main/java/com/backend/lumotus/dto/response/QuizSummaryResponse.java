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
    Boolean isImmutable,
    String slug,
    Long uniqueUserCount
) {
    public static QuizSummaryResponse from(Quiz quiz) {
        int qCount = quiz.getComputedQuestionCount() != null
                ? quiz.getComputedQuestionCount()
                : (quiz.getQuestionCount() != null ? quiz.getQuestionCount() : 0);
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
                qCount,
                quiz.getAttemptCount(),
                quiz.getAvgScore(),
                quiz.getCreatedAt(),
                quiz.getQuizType().name(),
                quiz.getIsImmutable(),
                quiz.getSlug(),
                quiz.getUniqueUserCount() != null ? quiz.getUniqueUserCount() : 0L
        );
    }
}
