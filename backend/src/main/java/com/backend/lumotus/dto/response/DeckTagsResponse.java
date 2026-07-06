package com.backend.lumotus.dto.response;

import java.util.List;

public record DeckTagsResponse(
        List<String> tags
) {
    public static DeckTagsResponse of(List<String> tags) {
        return new DeckTagsResponse(tags);
    }
}
