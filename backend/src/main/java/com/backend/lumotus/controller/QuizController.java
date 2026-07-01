package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.CreateQuizRequest;
import com.backend.lumotus.dto.request.HeartbeatRequest;
import com.backend.lumotus.dto.request.ImportQuizRequest;
import com.backend.lumotus.dto.request.AddQuestionRequest;
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
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
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
            @RequestParam(defaultValue = "newest") String sort,
            @PageableDefault(size = 20) Pageable pageable) {
        // Ignore Pageable's sort - we use custom sort logic based on 'sort' param
        // to avoid conflict with repository's ORDER BY
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return ResponseEntity.ok(quizService.listExploreQuizzes(sortedPageable, sort));
    }

    @GetMapping("/explore/{quizRef}")
    public ResponseEntity<QuizDetailResponse> getExploreQuiz(@PathVariable String quizRef) {
        return ResponseEntity.ok(quizService.getExploreQuiz(quizRef));
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

    @GetMapping("/me/{quizRef}")
    public ResponseEntity<QuizDetailResponse> getMyQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        return ResponseEntity.ok(quizService.getMyQuiz(principal, quizRef));
    }

    @PutMapping("/{quizRef}")
    public ResponseEntity<QuizDetailResponse> updateQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @Valid @RequestBody UpdateQuizRequest request) {
        return ResponseEntity.ok(quizService.updateQuiz(principal, quizRef, request));
    }

    @PutMapping("/{quizRef}/questions/{questionId}")
    public ResponseEntity<Void> updateQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @PathVariable UUID questionId,
            @Valid @RequestBody UpdateQuestionRequest request) {
        quizService.updateQuestion(principal, quizRef, questionId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{quizRef}/questions")
    public ResponseEntity<QuizDetailResponse> addQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @Valid @RequestBody AddQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizService.addUserQuestion(principal, quizRef, request));
    }

    @DeleteMapping("/{quizRef}/questions/{questionId}")
    public ResponseEntity<Void> deleteQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @PathVariable UUID questionId) {
        quizService.deleteUserQuestion(principal, quizRef, questionId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{quizRef}")
    public ResponseEntity<Void> deleteQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        quizService.deleteQuiz(principal, quizRef);
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

    @PostMapping("/{quizRef}/start")
    public ResponseEntity<StartQuizResponse> startQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        return ResponseEntity.ok(quizService.startQuiz(principal, quizRef));
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

    @GetMapping("/{quizRef}/leaderboard")
    public ResponseEntity<List<QuizLeaderboardEntry>> getLeaderboard(
            @PathVariable String quizRef,
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(quizService.getQuizLeaderboard(quizRef, Math.min(limit, 50)));
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

    @GetMapping("/admin/all")
    public ResponseEntity<PageResponse<QuizSummaryResponse>> listAllForAdmin(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(quizService.listAllForAdmin(status, pageable));
    }

    // Admin: get quiz detail for editing
    @GetMapping("/admin/{quizRef}")
    public ResponseEntity<QuizDetailResponse> getAdminQuizDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef) {
        UUID quizId = UUID.fromString(quizRef);
        return ResponseEntity.ok(quizService.getMyQuiz(principal, quizId));
    }

    // Admin: update quiz
    @PutMapping("/admin/{quizRef}")
    public ResponseEntity<QuizDetailResponse> updateAdminQuiz(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @Valid @RequestBody UpdateQuizRequest request) {
        UUID quizId = UUID.fromString(quizRef);
        return ResponseEntity.ok(quizService.updateQuiz(principal, quizId, request));
    }

    // Admin: update question
    @PutMapping("/admin/{quizRef}/questions/{questionId}")
    public ResponseEntity<Void> updateAdminQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @PathVariable UUID questionId,
            @Valid @RequestBody UpdateQuestionRequest request) {
        log.info("PUT /admin/{}/questions/{} - request: {}", quizRef, questionId, request);
        quizService.updateAdminQuestion(quizRef, questionId, request);
        return ResponseEntity.ok().build();
    }

    // Admin: add question
    @PostMapping("/admin/{quizRef}/questions")
    public ResponseEntity<Void> addAdminQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @Valid @RequestBody AddQuestionRequest request) {
        quizService.addQuestion(quizRef, request);
        return ResponseEntity.ok().build();
    }

    // Admin: delete question
    @DeleteMapping("/admin/{quizRef}/questions/{questionId}")
    public ResponseEntity<Void> deleteAdminQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String quizRef,
            @PathVariable UUID questionId) {
        log.info("DELETE /admin/{}/questions/{}", quizRef, questionId);
        quizService.deleteQuestion(quizRef, questionId);
        return ResponseEntity.noContent().build();
    }
}
