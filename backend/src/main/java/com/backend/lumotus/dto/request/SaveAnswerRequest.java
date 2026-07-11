package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;


public record SaveAnswerRequest(
    @NotBlank String questionId,
    @NotBlank String answer
) {}
