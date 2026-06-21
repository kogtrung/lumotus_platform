package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.Card;
import com.backend.lumotus.entity.UserCardReview;
import java.time.Instant;
import java.util.UUID;

public record DueCardResponse(
        UUID cardId,
        UUID deckId,
        String front,
        String back,
        String phonetic,
        String example,
        String hint,
        String imageUrl,
        String audioUrl,
        boolean isNew,
        boolean isStarred,
        Integer repetitions,
        Integer intervalDays,
        Instant nextReviewAt) {

    public static DueCardResponse fromReview(Card card, UserCardReview review) {
        return new DueCardResponse(
                card.getId(),
                card.getDeckId(),
                card.getFront(),
                card.getBack(),
                card.getPhonetic(),
                card.getExample(),
                card.getHint(),
                card.getImageUrl(),
                card.getAudioUrl(),
                false,
                review.isStarred(),
                review.getRepetitions(),
                review.getIntervalDays(),
                review.getNextReviewAt());
    }

    public static DueCardResponse fromNewCard(Card card) {
        return new DueCardResponse(
                card.getId(),
                card.getDeckId(),
                card.getFront(),
                card.getBack(),
                card.getPhonetic(),
                card.getExample(),
                card.getHint(),
                card.getImageUrl(),
                card.getAudioUrl(),
                true,
                false,
                null,
                null,
                null);
    }
}
