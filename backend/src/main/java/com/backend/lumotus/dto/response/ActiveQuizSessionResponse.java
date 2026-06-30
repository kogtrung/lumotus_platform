package com.backend.lumotus.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ActiveQuizSessionResponse(
    UUID attemptId,
    UUID quizId,
    String quizTitle,
    Integer timeLimitSeconds,
    long startedAtEpochSecond,
    int remainingSeconds
) {}
