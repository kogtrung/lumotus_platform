package com.backend.lumotus.service;

import com.backend.lumotus.config.AppProperties;
import com.backend.lumotus.dto.response.ActivityDayResponse;
import com.backend.lumotus.dto.response.LeaderboardEntry;
import com.backend.lumotus.dto.response.ProgressResponse;
import com.backend.lumotus.entity.DailyActivity;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.repository.DailyActivityRepository;
import com.backend.lumotus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Progress service for heatmap data, streak info, and leaderboard.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProgressService {

    private final UserRepository userRepository;
    private final DailyActivityRepository dailyActivityRepository;
    private final LeaderboardService leaderboardService;

    /**
     * Get progress data for the current user.
     * Includes: heatmap (last 365 days), current streak, total XP, rank.
     */
    @Transactional(readOnly = true)
    public ProgressResponse getMyProgress(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get heatmap data for the last 365 days
        LocalDate endDate = LocalDate.now(AppProperties.APP_ZONE);
        LocalDate startDate = endDate.minusDays(364);

        List<DailyActivity> activities = dailyActivityRepository
                .findByUserIdAndDateRange(userId, startDate, endDate);

        List<ActivityDayResponse> heatmap = activities.stream()
                .map(a -> new ActivityDayResponse(
                        a.getId().getActivityDate().toString(),
                        a.getCardsReviewed(),
                        a.getQuizTaken(),
                        a.getXpEarned()))
                .collect(Collectors.toList());

        // Get leaderboard rank
        Long rank = leaderboardService.getUserRank(userId);
        long totalParticipants = leaderboardService.getTotalUsers();

        return new ProgressResponse(
                user.getXp(),
                user.getStreak(),
                user.getLastStudyDate(),
                heatmap,
                rank != null ? rank.intValue() : null,
                totalParticipants
        );
    }

    /**
     * Get global leaderboard.
     */
    public List<LeaderboardEntry> getLeaderboard(int limit) {
        return leaderboardService.getTopUsers(limit);
    }

    /**
     * Get heatmap data for a specific month (for calendar view).
     */
    @Transactional(readOnly = true)
    public List<ActivityDayResponse> getHeatmapForMonth(UUID userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<DailyActivity> activities = dailyActivityRepository
                .findByUserIdAndDateRange(userId, startDate, endDate);

        return activities.stream()
                .map(a -> new ActivityDayResponse(
                        a.getId().getActivityDate().toString(),
                        a.getCardsReviewed(),
                        a.getQuizTaken(),
                        a.getXpEarned()))
                .collect(Collectors.toList());
    }
}
