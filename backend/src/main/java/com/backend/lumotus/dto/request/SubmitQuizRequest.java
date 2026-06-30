package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record SubmitQuizRequest(
    String quizId,
    String attemptId,
    @NotEmpty List<AnswerSubmission> answers,
    Integer timeTakenSeconds
) {
    public record AnswerSubmission(
        @NotBlank String questionId,
        @NotBlank String selectedAnswer
    ) {}
}
