package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SubmitStudyRequest(
        @NotNull List<Answer> answers
) {
    public record Answer(
            @NotBlank String questionId,
            @NotBlank String selectedAnswer
    ) {}
}
