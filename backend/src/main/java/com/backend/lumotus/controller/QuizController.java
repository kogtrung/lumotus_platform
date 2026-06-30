package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.CreateQuizRequest;
import com.backend.lumotus.dto.request.HeartbeatRequest;
import com.backend.lumotus.dto.request.ImportQuizRequest;
import com.backend.lumotus.dto.request.ModerateQuizRequest;
import com.backend.lumotus.dto.request.SubmitForReviewRequest;
import com.backend.lumotus.dto.request.SubmitQuizRequest;
import com.backend.lumotus.dto.request.UpdateQuestionRequest;
import com.backend.lumotus.dto.request.UpdateQuizRequest;
import com.backend.lumotus.dto.response.*;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    // ============================================================
    // PUBLIC EXPLORE — browse & play approved quizzes
    // ============================================================

    @GetMapping("/explore")
    public ResponseEntity<PageResponse<QuizSummaryResponse>> listExploreQuizzes(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(quizService.listExploreQuizzes(pageable));
    }

    @GetMapping("/explore/{quizId}")
    public ResponseEntity<QuizDetailResponse> getExploreQuiz(@PathVariable UUID quizId) {
        return ResponseEntity.ok(quizService.getExploreQuiz(quizId));
    }

    // ============================================================
    // MY QUIZZES — user's own quizzes
    // ============================================================

    @GetMapping("/me")
    public ResponseEntity<PageResponse<QuizSummaryResponse>> listMyQuizzes(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(quizService.listMyQuizzes(principal, pageable));
    }

    @PostMapping
    public ResponseEntity<QuizDetailResponse> createQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateQuizRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.createQuiz(principal, request));
    }

    @GetMapping("/me/{quizId}")
    public ResponseEntity<QuizDetailResponse> getMyQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID quizId) {
        return ResponseEntity.ok(quizService.getMyQuiz(principal, quizId));
    }

    @PutMapping("/{quizId}")
    public ResponseEntity<QuizDetailResponse> updateQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID quizId,
            @Valid @RequestBody UpdateQuizRequest request) {
        return ResponseEntity.ok(quizService.updateQuiz(principal, quizId, request));
    }

    @PutMapping("/{quizId}/questions/{questionId}")
    public ResponseEntity<Void> updateQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID quizId,
            @PathVariable UUID questionId,
            @Valid @RequestBody UpdateQuestionRequest request) {
        quizService.updateQuestion(principal, quizId, questionId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{quizId}")
    public ResponseEntity<Void> deleteQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID quizId) {
        quizService.deleteQuiz(principal, quizId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/submit-review")
    public ResponseEntity<QuizSummaryResponse> submitForReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitForReviewRequest request) {
        return ResponseEntity.ok(quizService.submitForReview(principal, request));
    }

    // ============================================================
    // PLAY — start / submit
    // ============================================================

    @PostMapping("/{quizId}/start")
    public ResponseEntity<StartQuizResponse> startQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID quizId) {
        return ResponseEntity.ok(quizService.startQuiz(principal, quizId));
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

    // ============================================================
    // RESULTS
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

    @GetMapping("/{quizId}/leaderboard")
    public ResponseEntity<List<QuizLeaderboardEntry>> getLeaderboard(
            @PathVariable UUID quizId,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(quizService.getQuizLeaderboard(quizId, Math.min(limit, 50)));
    }

    // ============================================================
    // ADMIN MODERATION
    // ============================================================

    @PostMapping("/admin/import")
    public ResponseEntity<ImportQuizResponse> importFromCsv(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ImportQuizRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.importFromCsv(principal, request));
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
