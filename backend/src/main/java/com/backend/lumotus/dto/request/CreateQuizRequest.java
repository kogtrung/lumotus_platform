package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateQuizRequest(
    @NotBlank @Size(max = 200) String title,
    String description,
    String coverImageUrl,
    UUID deckId,
    Integer timeLimitSeconds,
    Integer questionCount,
    String quizType  // Optional: "GENERATED" (default) or "IMPORTED"
) {}
