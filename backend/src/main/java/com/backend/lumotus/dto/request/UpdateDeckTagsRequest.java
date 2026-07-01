package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateDeckTagsRequest(
        @NotNull List<@Size(max = 50) @Pattern(regexp = "^[a-z0-9-]+$", message = "tag must be lowercase alphanumeric with hyphens") String> tags
) {}
