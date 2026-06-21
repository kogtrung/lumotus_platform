package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.RateReviewRequest;
import com.backend.lumotus.dto.request.StarReviewRequest;
import com.backend.lumotus.dto.response.DueCardsResponse;
import com.backend.lumotus.dto.response.RateReviewResponse;
import com.backend.lumotus.dto.response.StarReviewResponse;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.ReviewService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/due")
    public ResponseEntity<DueCardsResponse> getDue(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID deckId,
            @RequestParam(required = false) String deckRef,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "false") boolean starredOnly) {
        if (deckRef != null && !deckRef.isBlank()) {
            return ResponseEntity.ok(
                    reviewService.getDueCardsForDeckRef(principal, deckRef, limit, starredOnly));
        }
        return ResponseEntity.ok(reviewService.getDueCards(principal, deckId, limit, starredOnly));
    }

    @PostMapping("/{cardId}/rate")
    public ResponseEntity<RateReviewResponse> rate(
            @PathVariable UUID cardId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RateReviewRequest request) {
        return ResponseEntity.ok(reviewService.rateCard(cardId, request, principal));
    }

    @PostMapping("/{cardId}/star")
    public ResponseEntity<StarReviewResponse> star(
            @PathVariable UUID cardId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) StarReviewRequest request) {
        StarReviewRequest body = request != null ? request : new StarReviewRequest(null);
        return ResponseEntity.ok(reviewService.toggleStar(cardId, body, principal));
    }
}
