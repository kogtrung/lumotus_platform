package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.StudyMode;
import java.util.List;

public record StartStudyResponse(
        String attemptId,
        StudyMode studyMode,
        String deckTitle,
        int cardCount,
        List<QuestionResponse> questions
) {}
