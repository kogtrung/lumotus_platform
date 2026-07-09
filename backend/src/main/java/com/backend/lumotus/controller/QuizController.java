package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.*;
import com.backend.lumotus.dto.response.*;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.QuizCooldownService;
import com.backend.lumotus.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final QuizCooldownService quizCooldownService;

    // ============================================================
    // PUBLIC EXPLORE — browse & play APPROVED quizzes
    // ============================================================

    @GetMapping("/explore")
    public ResponseEntity<PageResponse<QuizSummaryResponse>> listExploreQuizzes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "newest") String sort,
            @PageableDefault(size = 20) Pageable pageable) {
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return ResponseEntity.ok(quizService.listExploreQuizzes(sortedPageable, sort, principal));
    }

    @GetMapping("/explore/{quizRef}")
    public ResponseEntity<QuizDetailResponse> getExploreQuiz(@PathVariable String quizRef) {
        return ResponseEntity.ok(quizService.getExploreQuiz(quizRef));
    }

    /**
     * GET /api/v1/quizzes/deck/{deckId}
     * List all quizzes for a deck (owner/admin only).
     */
    @GetMapping("/deck/{deckId}")
    public ResponseEntity<PageResponse<QuizSummaryResponse>> listQuizzesByDeck(
            @PathVariable UUID deckId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(quizService.listQuizzesByDeck(deckId, pageable));
    }

    // ============================================================
    // PLAY — start / auto-save / submit
    // ============================================================

    @PostMapping("/{quizRef}/start")
    public ResponseEntity<StartQuizResponse> startQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        return ResponseEntity.ok(quizService.startQuiz(principal, quizRef));
    }

    /**
     * GET /api/v1/quizzes/{quizRef}/cooldown-status
     * Check cooldown status for the current user on a specific quiz.
     * Does NOT throw — returns the result so frontend can display countdown.
     */
    @GetMapping("/{quizRef}/cooldown-status")
    public ResponseEntity<CooldownCheckResult> getCooldownStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        // Resolve quizRef to quizId
        com.backend.lumotus.entity.Quiz quiz = quizService.findQuizByRef(quizRef);
        CooldownCheckResult result = quizCooldownService.getCooldownStatus(principal.getId(), quiz.getId());
        return ResponseEntity.ok(result);
    }

    /**
     * Auto-save an answer during quiz play.
     * Called debounced from frontend when user selects an answer.
     */
    @PostMapping("/sessions/{attemptId}/answer")
    public ResponseEntity<Void> saveAnswer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID attemptId,
            @Valid @RequestBody SaveAnswerRequest request) {
        quizService.saveAnswer(principal, attemptId, request);
        return ResponseEntity.ok().build();
    }

    /**
     * Sync offline answers when coming back online.
     */
    @PostMapping("/sessions/{attemptId}/sync")
    public ResponseEntity<Void> syncOfflineAnswers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID attemptId,
            @Valid @RequestBody SyncAnswersRequest request) {
        quizService.syncOfflineAnswers(principal, attemptId, request);
        return ResponseEntity.ok().build();
    }

    /**
     * Mark a question as skipped (timeout).
     */
    @PostMapping("/sessions/{attemptId}/skip")
    public ResponseEntity<Void> skipQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID attemptId,
            @Valid @RequestBody SkipQuestionRequest request) {
        quizService.skipQuestion(principal, attemptId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/submit")
    public ResponseEntity<QuizResultResponse> submitQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitQuizRequest request) {
        return ResponseEntity.ok(quizService.submitQuiz(principal, request));
    }

    @GetMapping("/resume/{attemptId}")
    public ResponseEntity<QuizSessionResumeResponse> resumeSession(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID attemptId) {
        return ResponseEntity.ok(quizService.resumeSession(principal, attemptId));
    }

    @PostMapping("/session/heartbeat")
    public ResponseEntity<Void> heartbeat(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody HeartbeatRequest request) {
        quizService.extendSession(principal, request.attemptId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me/active-sessions")
    public ResponseEntity<List<ActiveQuizSessionResponse>> getActiveSessions(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(quizService.getActiveSessions(principal));
    }

    @PostMapping("/quit/{attemptId}")
    public ResponseEntity<QuizResultResponse> quitQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID attemptId) {
        return ResponseEntity.ok(quizService.quitQuiz(principal, attemptId));
    }

    // ============================================================
    // RESULTS & HISTORY
    // ============================================================

    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<QuizResultResponse> getAttemptResult(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID attemptId) {
        return ResponseEntity.ok(quizService.getAttemptResult(attemptId, principal));
    }

    @GetMapping("/attempts")
    public ResponseEntity<PageResponse<QuizAttemptSummaryResponse>> getMyAttemptHistory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(quizService.getMyAttemptHistory(principal, pageable));
    }

    // ============================================================
    // LEADERBOARD
    // ============================================================

    @GetMapping("/leaderboard")
    public ResponseEntity<List<GlobalQuizLeaderboardEntry>> getGlobalQuizLeaderboard(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(quizService.getGlobalQuizLeaderboard(Math.min(limit, 100)));
    }

    @GetMapping("/leaderboard/global/me")
    public ResponseEntity<GlobalQuizLeaderboardEntry> getMyGlobalQuizLeaderboardEntry(
            @AuthenticationPrincipal UserPrincipal principal) {
        return quizService.getGlobalUserEntry(principal.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/leaderboard/weekly")
    public ResponseEntity<List<com.backend.lumotus.dto.response.LeaderboardEntry>> getWeeklyQuizLeaderboard(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(quizService.getWeeklyQuizLeaderboard(Math.min(limit, 50)));
    }

    @GetMapping("/leaderboard/weekly/me")
    public ResponseEntity<com.backend.lumotus.dto.response.LeaderboardEntry> getMyWeeklyQuizLeaderboardEntry(
            @AuthenticationPrincipal UserPrincipal principal) {
        return quizService.getWeeklyUserEntry(principal.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/{quizRef}/leaderboard")
    public ResponseEntity<List<QuizLeaderboardEntry>> getLeaderboard(
            @PathVariable String quizRef,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(quizService.getQuizLeaderboard(quizRef, Math.min(limit, 50)));
    }

    // ============================================================
    // ADMIN: QUIZ MANAGEMENT
    // ============================================================

    /**
     * Create an empty quiz (ADMIN only).
     */
    @PostMapping("/admin/empty")
    public ResponseEntity<QuizDetailResponse> createEmptyQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateQuizRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.createEmptyQuiz(principal, request));
    }

    /**
     * Update a quiz (ADMIN only).
     */
    @PutMapping("/admin/{quizRef}")
    public ResponseEntity<QuizDetailResponse> updateQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @Valid @RequestBody UpdateQuizRequest request) {
        return ResponseEntity.ok(quizService.updateQuiz(quizRef, request));
    }

    /**
     * Delete a quiz (ADMIN only).
     */
    @DeleteMapping("/admin/{quizRef}")
    public ResponseEntity<Void> deleteQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        quizService.deleteQuiz(quizRef);
        return ResponseEntity.noContent().build();
    }

    /**
     * Publish a quiz to make it available in Explore (ADMIN only).
     */
    @PostMapping("/admin/{quizRef}/publish")
    public ResponseEntity<QuizSummaryResponse> publishQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        return ResponseEntity.ok(quizService.publishQuiz(quizRef));
    }

    /**
     * Unpublish a quiz from Explore (ADMIN only).
     */
    @PostMapping("/admin/{quizRef}/unpublish")
    public ResponseEntity<QuizSummaryResponse> unpublishQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        return ResponseEntity.ok(quizService.unpublishQuiz(quizRef));
    }

    // ============================================================
    // ADMIN: QUESTION MANAGEMENT
    // ============================================================

    @GetMapping("/admin/{quizRef}")
    public ResponseEntity<QuizDetailResponse> getAdminQuizDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        return ResponseEntity.ok(quizService.getAdminQuiz(quizRef));
    }

    @PutMapping("/admin/{quizRef}/questions/{questionId}")
    public ResponseEntity<Void> updateAdminQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @PathVariable UUID questionId,
            @Valid @RequestBody UpdateQuestionRequest request) {
        log.info("PUT /admin/{}/questions/{} - request: {}", quizRef, questionId, request);
        quizService.updateQuestion(quizRef, questionId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/{quizRef}/questions")
    public ResponseEntity<Void> addAdminQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @Valid @RequestBody AddQuestionRequest request) {
        quizService.addQuestion(quizRef, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/admin/{quizRef}/questions/{questionId}")
    public ResponseEntity<Void> deleteAdminQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @PathVariable UUID questionId) {
        log.info("DELETE /admin/{}/questions/{}", quizRef, questionId);
        quizService.deleteQuestion(quizRef, questionId);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // ADMIN: IMPORT & MODERATION
    // ============================================================

    @PostMapping("/admin/import")
    public ResponseEntity<ImportQuizResponse> importFromCsv(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ImportQuizRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.importFromCsv(principal, request));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<PageResponse<QuizSummaryResponse>> listAllForAdmin(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(quizService.listAllForAdmin(status, pageable));
    }

    @GetMapping("/admin/pending")
    public ResponseEntity<PageResponse<QuizModerationResponse>> listPending(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(quizService.listPendingQuizzes(pageable));
    }

    @PostMapping("/admin/moderate")
    public ResponseEntity<QuizSummaryResponse> moderateQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ModerateQuizRequest request) {
        return ResponseEntity.ok(quizService.moderateQuiz(principal, request));
    }

    @GetMapping("/admin/pending/count")
    public ResponseEntity<Long> countPending() {
        return ResponseEntity.ok(quizService.countPending());
    }
}
