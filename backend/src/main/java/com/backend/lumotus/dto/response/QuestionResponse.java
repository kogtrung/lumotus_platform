package com.backend.lumotus.dto.response;

import com.backend.lumotus.study.StudyAttempt;
import java.util.List;

public record QuestionResponse(
        String questionId,
        String type,
        String front,
        String phonetic,
        String hint,
        String imageUrl,
        String audioUrl,
        String correctAnswer,
        List<String> options,
        StudyAttempt.CardInfo cardInfo
) {}
