package com.backend.lumotus.dto.response;

import java.util.List;
import java.util.UUID;

public record DueCardsResponse(UUID deckId, int dueCount, List<DueCardResponse> cards) {}
