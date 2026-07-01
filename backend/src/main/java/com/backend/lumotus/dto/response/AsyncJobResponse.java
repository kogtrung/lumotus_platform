package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.AsyncJob;

import java.time.Instant;
import java.util.UUID;

public record AsyncJobResponse(
        UUID id,
        String type,
        String status,
        Object result,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt
) {
    public static AsyncJobResponse from(AsyncJob job) {
        return new AsyncJobResponse(
                job.getId(),
                job.getType().name(),
                job.getStatus().name(),
                job.getResult(),
                job.getErrorMessage(),
                job.getCreatedAt(),
                job.getUpdatedAt()
        );
    }
}
