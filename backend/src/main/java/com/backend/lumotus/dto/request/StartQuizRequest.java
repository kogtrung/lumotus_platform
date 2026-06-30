package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotBlank;

public record StartQuizRequest(
    @NotBlank String deckRef,
    Integer count,
    String direction
) {}
