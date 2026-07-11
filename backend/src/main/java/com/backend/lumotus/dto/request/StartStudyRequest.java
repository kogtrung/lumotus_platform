package com.backend.lumotus.dto.request;

import com.backend.lumotus.entity.StudyMode;
import jakarta.validation.constraints.NotNull;

public record StartStudyRequest(
        @NotNull StudyMode mode,
        Integer count,
        String direction
) {
    public StartStudyRequest {
        if (direction == null) direction = "forward";
    }
}
