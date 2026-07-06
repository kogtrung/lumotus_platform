package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record GenerateDeckRequest(
        @NotBlank(message = "Topic is required")
        @Size(max = 200, message = "Topic must be less than 200 characters")
        String topic,

        @Size(max = 500, message = "Description must be less than 500 characters")
        String description,

        @Size(min = 5, max = 100, message = "Card count must be between 5 and 100")
        int cardCount,

        String language,

        List<String> tags
) {}
