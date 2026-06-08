package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateTopicRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank
                @Size(max = 120)
                @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "slug must be lowercase kebab-case")
                String slug,
        String description,
        @Size(max = 100) String icon,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "colorHex must be #RRGGBB") String colorHex,
        Integer sortOrder) {}
