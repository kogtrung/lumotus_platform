package com.backend.lumotus.dto.response;

public record AnswerDetail(
        String questionId,
        String questionText,
        String correctAnswer,
        String selectedAnswer,
        boolean correct
) {}
