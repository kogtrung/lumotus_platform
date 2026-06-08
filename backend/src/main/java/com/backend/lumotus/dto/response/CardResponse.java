package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.Card;
import java.time.Instant;
import java.util.UUID;

public record CardResponse(
        UUID id,
        UUID deckId,
        String front,
        String back,
        String phonetic,
        String partOfSpeech,
        String hint,
        String example,
        String imageUrl,
        String icon,
        String audioUrl,
        String difficulty,
        int sortOrder,
        Instant createdAt,
        Instant updatedAt) {

    public static CardResponse from(Card card) {
        return new CardResponse(
                card.getId(),
                card.getDeckId(),
                card.getFront(),
                card.getBack(),
                card.getPhonetic(),
                card.getPartOfSpeech(),
                card.getHint(),
                card.getExample(),
                card.getImageUrl(),
                card.getIcon(),
                card.getAudioUrl(),
                card.getDifficulty(),
                card.getSortOrder(),
                card.getCreatedAt(),
                card.getUpdatedAt());
    }
}
