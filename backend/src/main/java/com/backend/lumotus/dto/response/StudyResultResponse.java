package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.StudyMode;
import java.util.List;

public record StudyResultResponse(
        String attemptId,
        StudyMode studyMode,
        double score,
        int correct,
        int total,
        int xpEarned,
        long timeTakenSeconds,
        List<AnswerDetail> details
) {}
