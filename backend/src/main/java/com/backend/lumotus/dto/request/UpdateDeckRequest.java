package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record UpdateDeckRequest(
        @Size(max = 200) String title,
        @Size(max = 120)
                @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "slug must be lowercase kebab-case")
                String slug,
        String description,
        String coverImageUrl,
        Boolean isPublic,
        Boolean isCopyable,
        @Size(max = 10) String languageFront,
        @Size(max = 10) String languageBack,
        List<UUID> topicIds) {}
