package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateQuestionRequest(
    @NotBlank @Size(max = 1000) String questionText,
    @NotBlank String correctAnswer,
    List<String> options,
    @NotBlank String questionType
) {}
