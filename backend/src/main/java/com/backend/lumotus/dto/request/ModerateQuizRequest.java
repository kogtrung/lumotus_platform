package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ModerateQuizRequest(
    @NotNull UUID quizId,
    @NotNull String action,
    @Size(max = 500) String note
) {}
