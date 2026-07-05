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
     * Build response. Questions are included for:
     * - GENERATED quizzes (always)
     * - User-imported quizzes (isImmutable=false, owner can edit)
     * - Admin-imported quizzes (isImmutable=true, immutable but visible)
     * 
     * Questions are hidden for OTHER USERS' APPROVED quizzes (anti-cheat).
     */
    public static QuizDetailResponse from(Quiz quiz, List<QuizQuestionResponse> questions, UUID requestingUserId) {
        boolean includeQuestions;
        
        if (quiz.getQuizType() == Quiz.QuizType.GENERATED) {
            // GENERATED: always show questions
            includeQuestions = true;
        } else if (!quiz.getIsImmutable()) {
            // User-imported (editable): owner can see questions
            includeQuestions = quiz.getOwnerId().equals(requestingUserId);
        } else {
            // Admin-imported (immutable): only show questions if user owns it
            includeQuestions = quiz.getOwnerId().equals(requestingUserId);
        }
        
        int qCount = questions != null ? questions.size() : (quiz.getQuestionCount() != null ? quiz.getQuestionCount() : 0);
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
            qCount,
            quiz.getAttemptCount(),
            quiz.getAvgScore(),
            quiz.getCreatedAt(),
            quiz.getUpdatedAt(),
            includeQuestions ? questions : null
        );
    }
    
    /**
     * Backward-compatible: shows questions for GENERATED or immutable (admin) quizzes.
     * Use the overload with requestingUserId for user-imported quizzes.
     */
    public static QuizDetailResponse from(Quiz quiz, List<QuizQuestionResponse> questions) {
        boolean includeQuestions = quiz.getIsImmutable() || quiz.getQuizType() == Quiz.QuizType.GENERATED;
        int qCount = questions != null ? questions.size() : (quiz.getQuestionCount() != null ? quiz.getQuestionCount() : 0);
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
            qCount,
            quiz.getAttemptCount(),
            quiz.getAvgScore(),
            quiz.getCreatedAt(),
            quiz.getUpdatedAt(),
            includeQuestions ? questions : null
        );
    }
}
