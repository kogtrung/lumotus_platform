package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateQuizRequest(
    @Size(max = 200) String title,
    String description,
    String coverImageUrl,
    Boolean isPublic,
    Integer timeLimitSeconds,
    Integer questionCount
) {}
