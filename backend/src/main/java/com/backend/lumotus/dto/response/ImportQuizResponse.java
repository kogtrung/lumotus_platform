package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.Quiz;

import java.util.UUID;

public record ImportQuizResponse(
    UUID quizId,
    String title,
    String status,
    int questionCount,
    int skippedRows,
    String message
) {
    public static ImportQuizResponse from(Quiz quiz, int skippedRows, String message) {
        return new ImportQuizResponse(
            quiz.getId(),
            quiz.getTitle(),
            quiz.getStatus().name(),
            quiz.getQuestionCount(),
            skippedRows,
            message
        );
    }
}
