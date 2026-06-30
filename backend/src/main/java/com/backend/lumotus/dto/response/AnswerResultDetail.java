package com.backend.lumotus.dto.response;

public record AnswerResultDetail(
    String questionId,
    String questionText,
    String correctAnswer,
    String selectedAnswer,
    Boolean isCorrect
) {}
