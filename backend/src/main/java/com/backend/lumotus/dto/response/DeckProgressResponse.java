package com.backend.lumotus.dto.response;

import java.util.UUID;

public record DeckProgressResponse(
    UUID deckId,
    int totalCards,
    int learnedCards,
    int masteredCards
) {}
