package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.QuizQuestion;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

public record QuizQuestionResponse(
    UUID id,
    String questionType,
    String questionText,
    String correctAnswer,
    List<String> options,
    Integer sortOrder
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static QuizQuestionResponse from(QuizQuestion q) {
        List<String> opts = Collections.emptyList();
        if (q.getOptions() != null && !q.getOptions().isBlank()) {
            try {
                opts = MAPPER.readValue(q.getOptions(), new TypeReference<>() {});
            } catch (Exception ignored) {}
        }
        return new QuizQuestionResponse(
            q.getId(),
            q.getQuestionType().name(),
            q.getQuestionText(),
            q.getCorrectAnswer(),
            opts,
            q.getSortOrder()
        );
    }
}
