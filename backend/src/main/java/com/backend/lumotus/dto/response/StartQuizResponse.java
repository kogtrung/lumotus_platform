package com.backend.lumotus.dto.response;

import java.util.List;
import java.util.UUID;

public record StartQuizResponse(
        UUID attemptId,
        String deckTitle,
        int totalQuestions,
        Integer timeLimitSeconds,
        long startedAtEpochSecond,
        List<QuizQuestionResponse> questions
) {}
