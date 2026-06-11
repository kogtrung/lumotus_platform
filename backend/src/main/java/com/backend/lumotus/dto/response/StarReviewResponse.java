package com.backend.lumotus.dto.response;

import java.util.UUID;

public record StarReviewResponse(UUID cardId, boolean starred) {}
