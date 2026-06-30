package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.Quiz;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record QuizDetailResponse(
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
    Instant updatedAt,
    List<QuizQuestionResponse> questions
) {
    /**
     * Build response. Questions are only included for GENERATED quizzes.
     * IMPORTED quizzes: questions = null (don't reveal answers before playing).
     */
    public static QuizDetailResponse from(Quiz quiz, List<QuizQuestionResponse> questions) {
        boolean includeQuestions = quiz.getQuizType() == Quiz.QuizType.GENERATED;
        return new QuizDetailResponse(
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
            quiz.getUpdatedAt(),
            includeQuestions ? questions : null
        );
    }
}
