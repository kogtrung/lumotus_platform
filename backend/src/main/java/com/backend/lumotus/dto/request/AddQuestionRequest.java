package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AddQuestionRequest(
    @NotBlank @Size(max = 1000) String questionText,
    @NotBlank String correctAnswer,  // letter A, B, C, or D (or full text for FILL_IN)
    List<String> options,  // with letter prefix: "A. answer1" (null/empty for FILL_IN)
    @NotBlank String questionType
) {}
