package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.Topic;
import java.util.UUID;

public record TopicResponse(
        UUID id,
        String name,
        String slug,
        String description,
        String icon,
        String colorHex,
        int sortOrder) {

    public static TopicResponse from(Topic topic) {
        return new TopicResponse(
                topic.getId(),
                topic.getName(),
                topic.getSlug(),
                topic.getDescription(),
                topic.getIcon(),
                topic.getColorHex(),
                topic.getSortOrder());
    }
}
