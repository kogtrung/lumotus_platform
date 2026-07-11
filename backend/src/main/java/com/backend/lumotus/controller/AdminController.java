package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.BypassCooldownRequest;
import com.backend.lumotus.dto.request.UpdateCooldownSettingsRequest;
import com.backend.lumotus.dto.response.AdminStatsResponse;
import com.backend.lumotus.dto.response.CooldownCheckResult;
import com.backend.lumotus.dto.response.CooldownSettingsResponse;
import com.backend.lumotus.dto.response.DeckSummaryResponse;
import com.backend.lumotus.dto.response.PageResponse;
import com.backend.lumotus.dto.response.CardResponse;
import com.backend.lumotus.dto.response.QuizAttemptAdminResponse;
import com.backend.lumotus.dto.response.UserAdminResponse;
import com.backend.lumotus.service.AdminService;
import com.backend.lumotus.service.QuizCooldownService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final QuizCooldownService quizCooldownService;

    /**
     * GET /api/v1/admin/stats
     * Get system-wide statistics.
     */
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    /**
     * GET /api/v1/admin/users
     * List all users with pagination.
     */
    @GetMapping("/users")
    public ResponseEntity<Page<UserAdminResponse>> listUsers(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.listUsers(pageable));
    }

    /**
     * GET /api/v1/admin/users/{userId}
     * Get a specific user.
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserAdminResponse> getUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(adminService.getUser(userId));
    }

    /**
     * PATCH /api/v1/admin/users/{userId}
     * Update user role or active status.
     */
    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserAdminResponse> updateUser(
            @PathVariable UUID userId,
            @RequestBody Map<String, Object> updates) {
        String role = (String) updates.get("role");
        Boolean active = (Boolean) updates.get("active");
        return ResponseEntity.ok(adminService.updateUser(userId, role, active));
    }

    // ============================================================
    // DECK MANAGEMENT
    // ============================================================

    /**
     * GET /api/v1/admin/decks/{deckRef}
     * Admin-only endpoint — bypasses user access checks so moderators can view
     * any deck including PENDING decks of other users.
     */
    @GetMapping("/decks/{deckRef}")
    public ResponseEntity<DeckSummaryResponse> getAdminDeck(
            @PathVariable String deckRef,
            @AuthenticationPrincipal com.backend.lumotus.security.UserPrincipal principal) {
        return ResponseEntity.ok(adminService.getAdminDeck(deckRef, principal.getRole()));
    }

    /**
     * GET /api/v1/admin/decks/{deckRef}/cards
     * Admin-only endpoint — bypasses user access checks for card listing.
     */
    @GetMapping("/decks/{deckRef}/cards")
    public ResponseEntity<PageResponse<CardResponse>> listAdminDeckCards(
            @PathVariable String deckRef,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(adminService.listAdminDeckCards(deckRef, q, pageable));
    }

    /**
     * GET /api/v1/admin/quiz-attempts
     * List all quiz attempts with pagination.
     */
    @GetMapping("/quiz-attempts")
    public ResponseEntity<Page<QuizAttemptAdminResponse>> listQuizAttempts(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getAllQuizAttempts(pageable));
    }

    /**
     * GET /api/v1/admin/quiz-attempts/user/{userId}
     * List quiz attempts for a specific user.
     */
    @GetMapping("/quiz-attempts/user/{userId}")
    public ResponseEntity<Page<QuizAttemptAdminResponse>> getUserQuizAttempts(
            @PathVariable UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getQuizAttemptsByUser(userId, pageable));
    }

    /**
     * GET /api/v1/admin/quiz-attempts/quiz/{quizId}
     * List quiz attempts for a specific quiz.
     */
    @GetMapping("/quiz-attempts/quiz/{quizId}")
    public ResponseEntity<Page<QuizAttemptAdminResponse>> getQuizAttempts(
            @PathVariable UUID quizId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getQuizAttemptsByQuiz(quizId, pageable));
    }

    // ============================================================
    // STUDY HISTORY
    // ============================================================

    /**
     * GET /api/v1/admin/study-history
     * Paginated study history grouped by user (master list).
     */
    @GetMapping("/study-history")
    public ResponseEntity<org.springframework.data.domain.Page<com.backend.lumotus.dto.response.DailyActivityAdminResponse>> getStudyHistory(
            @PageableDefault(size = 30) Pageable pageable) {
        return ResponseEntity.ok(adminService.getStudyHistory(pageable));
    }

    /**
     * GET /api/v1/admin/study-history/user/{userId}
     * Paginated daily activity log for a specific user (for admin detail drill-down).
     */
    @GetMapping("/study-history/user/{userId}")
    public ResponseEntity<org.springframework.data.domain.Page<com.backend.lumotus.dto.response.DailyActivityAdminResponse>> getUserStudyHistory(
            @PathVariable UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(adminService.getStudyHistoryByUser(userId, pageable));
    }

    // ============================================================
    // CHART / ANALYTICS STATS
    // ============================================================

    /**
     * GET /api/v1/admin/stats/charts?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     * Returns daily aggregated new-users / new-decks / quiz-attempts for chart rendering.
     */
    @GetMapping("/stats/charts")
    public ResponseEntity<java.util.List<com.backend.lumotus.dto.response.AdminChartDataPoint>> getChartStats(
            @RequestParam(required = false) java.time.LocalDate startDate,
            @RequestParam(required = false) java.time.LocalDate endDate) {
        java.time.LocalDate end = endDate != null ? endDate : java.time.LocalDate.now();
        java.time.LocalDate start = startDate != null ? startDate : end.minusDays(29);
        return ResponseEntity.ok(adminService.getChartStats(start, end));
    }

    // ============================================================
    // QUIZ COOLDOWN MANAGEMENT
    // ============================================================

    /**
     * GET /api/v1/admin/quiz-cooldown/settings
     * Get current cooldown settings.
     */
    @GetMapping("/quiz-cooldown/settings")
    public ResponseEntity<CooldownSettingsResponse> getCooldownSettings() {
        return ResponseEntity.ok(quizCooldownService.getSettings());
    }

    /**
     * PUT /api/v1/admin/quiz-cooldown/settings
     * Update cooldown settings (all fields required).
     */
    @PutMapping("/quiz-cooldown/settings")
    public ResponseEntity<CooldownSettingsResponse> updateCooldownSettings(
            @Valid @RequestBody UpdateCooldownSettingsRequest request) {
        return ResponseEntity.ok(quizCooldownService.updateSettings(request));
    }

    /**
     * POST /api/v1/admin/quiz-cooldown/bypass
     * Set a bypass for a specific user or quiz.
     */
    @PostMapping("/quiz-cooldown/bypass")
    public ResponseEntity<CooldownSettingsResponse> bypassCooldown(
            @Valid @RequestBody BypassCooldownRequest request) {
        return ResponseEntity.ok(quizCooldownService.bypassCooldown(request));
    }

    /**
     * DELETE /api/v1/admin/quiz-cooldown/bypass
     * Clear the current cooldown bypass.
     */
    @DeleteMapping("/quiz-cooldown/bypass")
    public ResponseEntity<CooldownSettingsResponse> clearBypass() {
        return ResponseEntity.ok(quizCooldownService.clearBypass());
    }

    /**
     * GET /api/v1/admin/quiz-cooldown/check?userId=&quizId=
     * Admin can check cooldown status for any user-quiz pair.
     */
    @GetMapping("/quiz-cooldown/check")
    public ResponseEntity<CooldownCheckResult> checkCooldown(
            @RequestParam UUID userId,
            @RequestParam UUID quizId) {
        return ResponseEntity.ok(quizCooldownService.getCooldownStatus(userId, quizId));
    }

    /**
     * POST /api/v1/admin/decks/{deckRef}/approve
     */
    @PostMapping("/decks/{deckRef}/approve")
    public ResponseEntity<DeckSummaryResponse> approveDeck(
            @PathVariable String deckRef,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) List<UUID> topicIds,
            @AuthenticationPrincipal com.backend.lumotus.security.UserPrincipal principal) {
        return ResponseEntity.ok(adminService.approveDeck(
                deckRef,
                principal.getRole(),
                principal.getId(),
                note,
                topicIds));
    }

    /**
     * POST /api/v1/admin/decks/{deckRef}/publish
     */
    @PostMapping("/decks/{deckRef}/publish")
    public ResponseEntity<DeckSummaryResponse> publishDeck(
            @PathVariable String deckRef,
            @AuthenticationPrincipal com.backend.lumotus.security.UserPrincipal principal) {
        return ResponseEntity.ok(adminService.publishDeck(
                deckRef,
                principal.getRole(),
                principal.getId()));
    }

    /**
     * POST /api/v1/admin/decks/{deckRef}/reject
     */
    @PostMapping("/decks/{deckRef}/reject")
    public ResponseEntity<DeckSummaryResponse> rejectDeck(
            @PathVariable String deckRef,
            @RequestParam(required = false) String note,
            @AuthenticationPrincipal com.backend.lumotus.security.UserPrincipal principal) {
        return ResponseEntity.ok(adminService.rejectDeck(
                deckRef,
                principal.getRole(),
                principal.getId(),
                note));
    }

    /**
     * DELETE /api/v1/admin/decks/{deckRef}
     * Hard delete a deck and all its related data (permanent, irreversible).
     */
    @DeleteMapping("/decks/{deckRef}")
    public ResponseEntity<Void> hardDeleteDeck(
            @PathVariable String deckRef,
            @AuthenticationPrincipal com.backend.lumotus.security.UserPrincipal principal) {
        adminService.hardDeleteDeck(deckRef, principal.getRole());
        return ResponseEntity.noContent().build();
    }
}
