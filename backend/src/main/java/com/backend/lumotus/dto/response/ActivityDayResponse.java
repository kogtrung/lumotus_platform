package com.backend.lumotus.dto.response;

public record ActivityDayResponse(
        String date,
        int cards,
        int quizzes,
        int xp
) {}
