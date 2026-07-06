package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.Quiz;
import com.backend.lumotus.entity.QuizQuestion;

import java.util.List;
import java.util.UUID;

public record ImportQuizResponse(
    UUID quizId,
    String slug,
    String title,
    String status,
    int questionCount,
    int importedCount,
    int skippedRows,
    String message,
    List<QuizQuestionResponse> questions
) {
    public static ImportQuizResponse from(Quiz quiz, List<QuizQuestion> rawQuestions, int skippedRows, String message) {
        int importedCount = rawQuestions.size();
        List<QuizQuestionResponse> questionResponses = rawQuestions.stream()
                .map(QuizQuestionResponse::from)
                .toList();
        return new ImportQuizResponse(
            quiz.getId(),
            quiz.getSlug(),
            quiz.getTitle(),
            quiz.getStatus().name(),
            quiz.getQuestionCount(),
            importedCount,
            skippedRows,
            message,
            questionResponses
        );
    }
}
