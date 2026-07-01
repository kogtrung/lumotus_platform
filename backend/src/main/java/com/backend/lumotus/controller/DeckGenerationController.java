package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.GenerateDeckRequest;
import com.backend.lumotus.dto.response.AsyncJobResponse;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.AsyncJobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/decks")
@RequiredArgsConstructor
public class DeckGenerationController {

    private final AsyncJobService asyncJobService;

    /**
     * POST /api/v1/decks/generate
     * Start AI deck generation job.
     */
    @PostMapping("/generate")
    public ResponseEntity<AsyncJobResponse> generateDeck(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody GenerateDeckRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(asyncJobService.createGenerationJob(principal, request));
    }

    /**
     * GET /api/v1/decks/jobs/{jobId}
     * Poll job status.
     */
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<AsyncJobResponse> getJobStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID jobId) {
        return ResponseEntity.ok(asyncJobService.getJob(jobId, principal.getId()));
    }

    /**
     * GET /api/v1/decks/jobs
     * Get all user's jobs (including completed).
     */
    @GetMapping("/jobs")
    public ResponseEntity<List<AsyncJobResponse>> getUserJobs(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(asyncJobService.getUserJobs(principal.getId()));
    }

    /**
     * GET /api/v1/decks/jobs/active
     * Get only pending/processing jobs (for polling).
     */
    @GetMapping("/jobs/active")
    public ResponseEntity<List<AsyncJobResponse>> getActiveJobs(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(asyncJobService.getActiveJobs(principal.getId()));
    }
}
