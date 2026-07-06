package com.backend.lumotus.dto.response;

import java.util.UUID;

public record ActiveQuizSessionResponse(
    UUID attemptId,
    UUID quizId,
    String quizSlug,
    String quizTitle,
    Integer timeLimitSeconds,
    long startedAtEpochSecond,
    int remainingSeconds
) {}
