package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ImportQuizRequest(
    @NotBlank @Size(max = 200) String title,
    String description,
    String coverImageUrl,
    Integer timeLimitSeconds,
    @NotBlank String csvContent   // raw CSV string, 6 columns per row
) {}
