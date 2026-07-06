package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record SaveAnswerRequest(
    @NotBlank String questionId,
    @NotBlank String answer
) {}
