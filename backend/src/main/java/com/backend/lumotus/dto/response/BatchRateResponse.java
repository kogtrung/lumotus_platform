package com.backend.lumotus.dto.response;

import java.util.List;

public record BatchRateResponse(
        int totalProcessed,
        int totalXpEarned,
        List<RateReviewResponse> details
) {}
