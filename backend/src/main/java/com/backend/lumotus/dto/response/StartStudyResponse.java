package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.StudyMode;
import java.util.List;
import java.util.UUID;

public record StartStudyResponse(
        UUID attemptId,
        StudyMode studyMode,
        String deckTitle,
        int cardCount,
        List<QuestionResponse> questions
) {}
