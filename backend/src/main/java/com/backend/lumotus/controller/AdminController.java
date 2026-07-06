package com.backend.lumotus.controller;

import com.backend.lumotus.dto.request.BypassCooldownRequest;
import com.backend.lumotus.dto.request.UpdateCooldownSettingsRequest;
import com.backend.lumotus.dto.response.AdminStatsResponse;
import com.backend.lumotus.dto.response.CooldownCheckResult;
import com.backend.lumotus.dto.response.CooldownSettingsResponse;
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
import org.springframework.web.bind.annotation.*;

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
}
