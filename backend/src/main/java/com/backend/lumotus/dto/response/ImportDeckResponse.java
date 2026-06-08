package com.backend.lumotus.dto.response;

import java.util.List;

public record ImportDeckResponse(
        DeckSummaryResponse deck, int addedCount, int updatedCount, int skippedCount, List<String> errors) {}
