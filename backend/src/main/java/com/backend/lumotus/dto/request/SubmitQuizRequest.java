package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record SubmitQuizRequest(
    String attemptId,
    List<AnswerSubmission> answers,
    Integer timeTakenSeconds
) {
    public record AnswerSubmission(
        @NotBlank String questionId,
        @NotBlank String selectedAnswer
    ) {}
}
