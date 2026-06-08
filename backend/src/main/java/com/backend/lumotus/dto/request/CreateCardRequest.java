package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCardRequest(
        @NotBlank String front,
        @NotBlank String back,
        @Size(max = 200) String phonetic,
        @Size(max = 50) String partOfSpeech,
        String hint,
        String example,
        String imageUrl,
        @Size(max = 100) String icon,
        String audioUrl,
        @Size(max = 20) String difficulty,
        Integer sortOrder) {}
