package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 3, max = 50) String username,
        String avatarUrl) {}
