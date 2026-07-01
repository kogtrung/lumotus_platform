package com.backend.lumotus.controller;

import com.backend.lumotus.dto.response.ActivityDayResponse;
import com.backend.lumotus.dto.response.LeaderboardEntry;
import com.backend.lumotus.dto.response.ProgressResponse;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.ProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    /**
     * GET /api/v1/progress/me
     * Returns current user's progress data: XP, streak, heatmap (365 days), rank.
     */
    @GetMapping("/me")
    public ResponseEntity<ProgressResponse> getMyProgress(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(progressService.getMyProgress(principal.getId()));
    }

    /**
     * GET /api/v1/progress/leaderboard?limit=50
     * Returns global leaderboard (top N users by composite score).
     */
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard(
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(progressService.getLeaderboard(Math.min(limit, 100)));
    }

    /**
     * GET /api/v1/progress/heatmap?year=2026&month=6
     * Returns heatmap data for a specific month.
     */
    @GetMapping("/heatmap")
    public ResponseEntity<List<ActivityDayResponse>> getHeatmap(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(
                progressService.getHeatmapForMonth(principal.getId(), year, month));
    }
}
