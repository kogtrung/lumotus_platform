package com.backend.lumotus.dto.request;

import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record SubmitDeckApprovalRequest(
        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        List<UUID> topicIds,

        @Size(max = 200, message = "Requested topic must be at most 200 characters")
        String requestedTopic
) {}
