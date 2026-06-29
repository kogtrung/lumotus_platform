package com.backend.lumotus.dto.request;

import com.backend.lumotus.entity.StudyMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StartStudyRequest(
        @NotNull StudyMode mode,
        @Min(1) @Max(100) Integer count,
        String direction
) {
    public StartStudyRequest {
        if (count == null) count = 10;
        if (direction == null) direction = "forward";
    }
}
