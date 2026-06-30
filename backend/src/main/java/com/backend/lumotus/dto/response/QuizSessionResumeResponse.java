package com.backend.lumotus.dto.response;

import com.backend.lumotus.service.QuizSessionService.SessionResumeData;

public record QuizSessionResumeResponse(
        int remainingSeconds,
        long startedAtEpochSecond,
        Integer timeLimitSeconds,
        boolean sessionFound
) {
    public static QuizSessionResumeResponse from(SessionResumeData data) {
        return new QuizSessionResumeResponse(
                data.remainingSeconds(),
                data.startedAtEpochSecond(),
                data.timeLimitSeconds(),
                true
        );
    }

    public static QuizSessionResumeResponse notFound() {
        return new QuizSessionResumeResponse(-1, 0, null, false);
    }
}
