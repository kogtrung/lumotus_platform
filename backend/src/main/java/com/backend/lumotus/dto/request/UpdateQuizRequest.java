package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateQuizRequest(
    @Size(max = 200) String title,
    String description,
    String coverImageUrl,
    Boolean isPublic,
    Integer timeLimitSeconds,
    Integer questionCount
) {}
