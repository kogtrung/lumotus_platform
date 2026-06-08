package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.Deck;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DeckSummaryResponse(
        UUID id,
        String slug,
        String title,
        String description,
        String coverImageUrl,
        UUID ownerId,
        String ownerUsername,
        String ownerType,
        boolean isPublic,
        boolean isCopyable,
        String languageFront,
        String languageBack,
        int viewCount,
        int copyCount,
        long cardCount,
        List<TopicResponse> topics,
        Instant createdAt,
        Instant updatedAt) {

    public static DeckSummaryResponse from(
            Deck deck, long cardCount, List<TopicResponse> topics, String ownerUsername) {
        return new DeckSummaryResponse(
                deck.getId(),
                deck.getSlug(),
                deck.getTitle(),
                deck.getDescription(),
                deck.getCoverImageUrl(),
                deck.getOwnerId(),
                ownerUsername,
                deck.getOwnerType().name(),
                deck.isPublic(),
                deck.isCopyable(),
                deck.getLanguageFront(),
                deck.getLanguageBack(),
                deck.getViewCount(),
                deck.getCopyCount(),
                cardCount,
                topics,
                deck.getCreatedAt(),
                deck.getUpdatedAt());
    }
}
