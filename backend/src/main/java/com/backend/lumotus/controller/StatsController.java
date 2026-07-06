package com.backend.lumotus.controller;

import com.backend.lumotus.dto.response.ActivitySummaryResponse;
import com.backend.lumotus.dto.response.DashboardStatsResponse;
import com.backend.lumotus.dto.response.WeeklySummaryResponse;
import com.backend.lumotus.security.UserPrincipal;
import com.backend.lumotus.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(statsService.getDashboardStats(principal.getId()));
    }

    @GetMapping("/activity")
    public ResponseEntity<ActivitySummaryResponse> getActivity(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(statsService.getActivitySummary(principal.getId(), days));
    }

    @GetMapping("/weekly")
    public ResponseEntity<WeeklySummaryResponse> getWeekly(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int offset) {
        return ResponseEntity.ok(statsService.getWeeklySummary(principal.getId(), offset));
    }
}
