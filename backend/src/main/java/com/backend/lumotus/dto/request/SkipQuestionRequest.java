package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SkipQuestionRequest(
    @NotBlank String questionId
) {}
