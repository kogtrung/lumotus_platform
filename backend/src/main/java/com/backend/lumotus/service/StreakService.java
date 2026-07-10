package com.backend.lumotus.service;

import com.backend.lumotus.entity.DailyActivity;
import com.backend.lumotus.entity.DailyActivityId;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.config.AppProperties;
import com.backend.lumotus.repository.DailyActivityRepository;
import com.backend.lumotus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

/**
 * Handles streak logic.
 *
 * Trigger conditions (per day):
 * - >= 10 SRS cards reviewed (cardsReviewed >= 10 in DailyActivity)
 * - OR 1 quiz completed (quizTaken >= 1 in DailyActivity)
 *
 * Streak rules:
 * - Distance = 0 (studied today): keep streak unchanged
 * - Distance = 1 (next day): streak++
 * - Distance > 1 (missed day): streak reset to 1
 *
 * Daily scheduler runs at 01:00 UTC to reset stale streaks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StreakService {

    private static final int MIN_CARDS_FOR_STREAK = 10;

    private final UserRepository userRepository;
    private final DailyActivityRepository dailyActivityRepository;

    /**
     * Called after a flashcard rating or quiz submission to update streak.
     * Call this once per day per user (idempotent — checks lastStudyDate).
     */
    @Transactional
    public void recordStudyActivity(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        LocalDate today = LocalDate.now(AppProperties.APP_ZONE);
        LocalDate lastStudy = user.getLastStudyDate();

        // Already counted today — skip, unless impacted by the zero-streak day 1 bug
        if (today.equals(lastStudy)) {
            if (user.getStreak() == 0) {
                user.setStreak(1);
                userRepository.save(user);
            }
            return;
        }

        // Check if user qualified today (>= 10 cards OR 1 quiz)
        DailyActivityId daId = new DailyActivityId(userId, today);
        DailyActivity activity = dailyActivityRepository.findById(daId).orElse(null);
        if (activity == null) return;

        boolean qualifies = activity.getCardsReviewed() >= MIN_CARDS_FOR_STREAK
                || activity.getQuizTaken() >= 1;
        if (!qualifies) return;

        int distance = lastStudy == null ? -1 :
                (int) ChronoUnit.DAYS.between(lastStudy, today);

        if (distance < 0) {
            // First time studying
            user.setStreak(1);
        } else if (distance == 0) {
            // Same day edge case or manual trigger
        } else if (distance == 1) {
            user.setStreak(user.getStreak() + 1);
        } else {
            user.setStreak(1); // missed day(s) — reset
        }

        user.setLastStudyDate(today);
        userRepository.save(user);
        log.debug("Streak updated: userId={}, streak={}, lastStudy={}", userId, user.getStreak(), today);
    }

    /**
     * Daily scheduler: runs at 01:00 Asia/Ho_Chi_Minh every day.
     * Resets streak = 0 for users who haven't studied by end of yesterday.
     */
    @Scheduled(cron = "0 0 1 * * *", zone = "Asia/Ho_Chi_Minh")
    @Transactional
    public void resetStaleStreaks() {
        LocalDate yesterday = LocalDate.now(AppProperties.APP_ZONE).minusDays(1);

        List<User> activeUsers = userRepository.findAll().stream()
                .filter(u -> u.isActive())
                .filter(u -> {
                    LocalDate lastStudy = u.getLastStudyDate();
                    return lastStudy != null && lastStudy.isBefore(yesterday);
                })
                .toList();

        for (User user : activeUsers) {
            user.setStreak(0);
            userRepository.save(user);
            log.info("Streak reset for user {} (last studied: {})", user.getId(), user.getLastStudyDate());
        }

        log.info("Daily streak reset complete: {} users affected", activeUsers.size());
    }

    /**
     * Admin utility: recalculate streak for a specific user.
     */
    @Transactional
    public void recalculateStreak(UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        // Walk backwards from today to find last qualifying study day
        LocalDate today = LocalDate.now(AppProperties.APP_ZONE);
        int streak = 0;
        LocalDate cursor = today;

        while (!cursor.isBefore(LocalDate.of(2020, 1, 1))) { // safety limit
            DailyActivityId daId = new DailyActivityId(userId, cursor);
            DailyActivity activity = dailyActivityRepository.findById(daId).orElse(null);
            boolean qualifies = activity != null && (
                    activity.getCardsReviewed() >= MIN_CARDS_FOR_STREAK
                    || activity.getQuizTaken() >= 1
            );

            if (qualifies) {
                streak++;
                cursor = cursor.minusDays(1);
            } else if (cursor.equals(today)) {
                // Today not qualified yet — skip today, check yesterday
                cursor = cursor.minusDays(1);
            } else {
                break;
            }
        }

        user.setStreak(streak);
        if (streak > 0) {
            user.setLastStudyDate(cursor.plusDays(1));
        }
        userRepository.save(user);
        log.info("Streak recalculated for user {}: streak={}", userId, streak);
    }
}
