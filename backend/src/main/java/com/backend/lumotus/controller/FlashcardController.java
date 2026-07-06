package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.RateReviewRequest;
import com.backend.lumotus.dto.request.StarReviewRequest;
import com.backend.lumotus.dto.request.StartStudyRequest;
import com.backend.lumotus.dto.request.SubmitStudyRequest;
import com.backend.lumotus.dto.response.DeckProgressResponse;
import com.backend.lumotus.dto.response.DueCardsResponse;
import com.backend.lumotus.dto.response.RateReviewResponse;
import com.backend.lumotus.dto.response.StarReviewResponse;
import com.backend.lumotus.dto.response.StartStudyResponse;
import com.backend.lumotus.dto.response.StudyResultResponse;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.FlashcardService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    // ============================================================
    // STUDY SESSION
    // ============================================================

    @PostMapping("/{deckRef}/start")
    public ResponseEntity<StartStudyResponse> startFlashcard(
            @PathVariable String deckRef,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody StartStudyRequest request) {
        return ResponseEntity.ok(flashcardService.startFlashcard(principal, deckRef, request));
    }

    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<StudyResultResponse> submitFlashcard(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitStudyRequest request) {
        return ResponseEntity.ok(flashcardService.submitFlashcard(attemptId, request, principal));
    }

    @GetMapping("/{attemptId}/result")
    public ResponseEntity<StudyResultResponse> getFlashcardResult(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(flashcardService.getFlashcardResult(attemptId, principal));
    }

    // ============================================================
    // SRS REVIEW (Due cards & Progress)
    // ============================================================

    @GetMapping("/due-count")
    public ResponseEntity<Integer> getTotalDueCount(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID deckId,
            @RequestParam(required = false) String deckRef,
            @RequestParam(defaultValue = "false") boolean starredOnly) {
        int count;
        if (deckRef != null && !deckRef.isBlank()) {
            count = flashcardService.countTotalDueCardsForDeckRef(principal, deckRef, starredOnly);
        } else {
            count = flashcardService.countTotalDueCards(principal, deckId, starredOnly);
        }
        return ResponseEntity.ok(count);
    }

    @GetMapping("/due")
    public ResponseEntity<DueCardsResponse> getDue(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID deckId,
            @RequestParam(required = false) String deckRef,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "false") boolean starredOnly) {
        if (deckRef != null && !deckRef.isBlank()) {
            return ResponseEntity.ok(
                    flashcardService.getDueCardsForDeckRef(principal, deckRef, limit, starredOnly));
        }
        return ResponseEntity.ok(flashcardService.getDueCards(principal, deckId, limit, starredOnly));
    }

    @GetMapping("/progress")
    public ResponseEntity<DeckProgressResponse> getDeckProgress(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) UUID deckId,
            @RequestParam(required = false) String deckRef) {
        if (deckRef != null && !deckRef.isBlank()) {
            UUID resolvedDeckId = flashcardService.resolveDeckIdByRef(principal, deckRef);
            return ResponseEntity.ok(flashcardService.getDeckProgress(principal, resolvedDeckId));
        }
        if (deckId == null) {
            throw new IllegalArgumentException("Either deckId or deckRef must be provided");
        }
        return ResponseEntity.ok(flashcardService.getDeckProgress(principal, deckId));
    }

    @PostMapping("/{cardId}/rate")
    public ResponseEntity<RateReviewResponse> rate(
            @PathVariable UUID cardId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RateReviewRequest request) {
        return ResponseEntity.ok(flashcardService.rateCard(cardId, request, principal));
    }

    @PostMapping("/{cardId}/star")
    public ResponseEntity<StarReviewResponse> star(
            @PathVariable UUID cardId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) StarReviewRequest request) {
        StarReviewRequest body = request != null ? request : new StarReviewRequest(null);
        return ResponseEntity.ok(flashcardService.toggleStar(cardId, body, principal));
    }
}
