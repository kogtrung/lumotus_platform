package com.backend.lumotus.dto.response;

import java.util.List;

public record AnswerResultDetail(
    String questionId,
    String questionText,
    String correctAnswer,
    String selectedAnswer,
    boolean correct,
    List<String> options,
    String selectedLetter
) {}
