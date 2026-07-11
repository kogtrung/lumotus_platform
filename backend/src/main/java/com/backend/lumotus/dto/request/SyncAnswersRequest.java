package com.backend.lumotus.dto.request;


import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SyncAnswersRequest(
    @NotNull List<OfflineAnswer> answers
) {
    public record OfflineAnswer(
        @NotNull String questionId,
        String answer,
        Long answeredAt
    ) {}
}
