package com.backend.lumotus.service;

import com.backend.lumotus.config.AppProperties;
import com.backend.lumotus.dto.response.*;
import com.backend.lumotus.entity.DailyActivity;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.repository.DailyActivityRepository;
import com.backend.lumotus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final DailyActivityRepository dailyActivityRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ActivitySummaryResponse getActivitySummary(UUID userId, int days) {
        LocalDate end = LocalDate.now(AppProperties.APP_ZONE);
        LocalDate start = end.minusDays(days - 1);

        List<DailyActivity> activities = dailyActivityRepository.findByUserIdAndDateRange(userId, start, end);

        List<ActivityDayResponse> daily = new ArrayList<>();
        LocalDate cursor = start;
        while (!cursor.isAfter(end)) {
            final LocalDate date = cursor;
            var entry = activities.stream()
                    .filter(a -> a.getId().getActivityDate().equals(date))
                    .findFirst()
                    .orElse(null);

            int cards = entry != null ? entry.getCardsReviewed() : 0;
            int quizzes = entry != null ? entry.getQuizTaken() : 0;
            int xp = entry != null ? entry.getXpEarned() : 0;

            daily.add(new ActivityDayResponse(
                    date.toString(),
                    cards,
                    quizzes,
                    xp
            ));
            cursor = cursor.plusDays(1);
        }

        int totalCards = daily.stream().mapToInt(ActivityDayResponse::cards).sum();
        int totalQuizzes = daily.stream().mapToInt(ActivityDayResponse::quizzes).sum();
        int totalXp = daily.stream().mapToInt(ActivityDayResponse::xp).sum();
        int activeDays = (int) daily.stream().filter(d -> d.cards() > 0 || d.quizzes() > 0).count();

        return new ActivitySummaryResponse(daily, totalCards, totalQuizzes, totalXp, activeDays);
    }

    @Transactional(readOnly = true)
    public WeeklySummaryResponse getWeeklySummary(UUID userId, int offset) {
        LocalDate today = LocalDate.now(AppProperties.APP_ZONE);
        LocalDate weekStart = today.with(DayOfWeek.MONDAY).minusWeeks(offset);
        LocalDate weekEnd = offset == 0 ? today : weekStart.plusDays(6);

        int cardsThisWeek = dailyActivityRepository.sumCardsReviewed(userId, weekStart, weekEnd);
        int quizzesThisWeek = dailyActivityRepository.sumQuizTaken(userId, weekStart, weekEnd);
        int xpThisWeek = dailyActivityRepository.sumXpEarned(userId, weekStart, weekEnd);

        // Previous week for comparison
        LocalDate prevWeekStart = weekStart.minusWeeks(1);
        LocalDate prevWeekEnd = offset <= 1 ? weekStart.minusDays(1) : prevWeekStart.plusDays(6);
        int cardsLastWeek = dailyActivityRepository.sumCardsReviewed(userId, prevWeekStart, prevWeekEnd);
        int quizzesLastWeek = dailyActivityRepository.sumQuizTaken(userId, prevWeekStart, prevWeekEnd);
        int xpLastWeek = dailyActivityRepository.sumXpEarned(userId, prevWeekStart, prevWeekEnd);

        // Per-day breakdown for the selected week
        List<ActivityDayResponse> weekDays = new ArrayList<>();
        LocalDate cursor = weekStart;
        while (!cursor.isAfter(weekEnd)) {
            final LocalDate date = cursor;
            var entry = dailyActivityRepository
                    .findByUserIdAndDateRange(userId, date, date)
                    .stream().findFirst().orElse(null);

            weekDays.add(new ActivityDayResponse(
                    date.toString(),
                    entry != null ? entry.getCardsReviewed() : 0,
                    entry != null ? entry.getQuizTaken() : 0,
                    entry != null ? entry.getXpEarned() : 0
            ));
            cursor = cursor.plusDays(1);
        }

        return new WeeklySummaryResponse(
                weekDays,
                new WeeklySummaryResponse.Totals(cardsThisWeek, quizzesThisWeek, xpThisWeek),
                new WeeklySummaryResponse.Totals(cardsLastWeek, quizzesLastWeek, xpLastWeek)
        );
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);

        // Last 7 days
        LocalDate end = LocalDate.now(AppProperties.APP_ZONE);
        LocalDate start7 = end.minusDays(6);
        int cards7d = dailyActivityRepository.sumCardsReviewed(userId, start7, end);
        int quizzes7d = dailyActivityRepository.sumQuizTaken(userId, start7, end);
        int xp7d = dailyActivityRepository.sumXpEarned(userId, start7, end);

        // Today
        int cardsToday = dailyActivityRepository.sumCardsReviewed(userId, end, end);
        int quizzesToday = dailyActivityRepository.sumQuizTaken(userId, end, end);
        int xpToday = dailyActivityRepository.sumXpEarned(userId, end, end);

        // Streak
        int streak = user != null ? user.getStreak() : 0;
        int totalXp = user != null ? user.getXp() : 0;

        return new DashboardStatsResponse(
                totalXp,
                streak,
                cards7d,
                quizzes7d,
                xp7d,
                cardsToday,
                quizzesToday,
                xpToday
        );
    }
}
