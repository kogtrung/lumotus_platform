package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record HeartbeatRequest(
        @NotNull UUID attemptId
) {}
