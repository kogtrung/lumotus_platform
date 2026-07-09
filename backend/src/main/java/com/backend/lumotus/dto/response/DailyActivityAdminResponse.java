package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.DailyActivity;

import java.time.LocalDate;
import java.util.UUID;

public record DailyActivityAdminResponse(
        UUID userId,
        String username,
        LocalDate date,
        int totalCards,
        int learnedCards,
        int cardsReviewed,
        int xpEarned,
        int quizTaken,
        int studyMinutes,
        Integer streak,
        Integer deckCount
) {
    /** Constructor without streak/deckCount – used for per-day detail rows. */
    public static DailyActivityAdminResponse from(DailyActivity da, String username) {
        return new DailyActivityAdminResponse(
                da.getId().getUserId(),
                username,
                da.getId().getActivityDate(),
                0, // totalCards
                0, // learnedCards
                da.getCardsReviewed(),
                da.getXpEarned(),
                da.getQuizTaken(),
                da.getStudyMinutes(),
                null,
                null
        );
    }
}
