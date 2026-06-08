package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateTopicRequest(
        @Size(max = 100) String name,
        String description,
        @Size(max = 100) String icon,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "colorHex must be #RRGGBB") String colorHex,
        Integer sortOrder) {}
