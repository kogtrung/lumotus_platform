package com.backend.lumotus.service;

import com.backend.lumotus.dto.response.LeaderboardEntry;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Global leaderboard service using Redis Sorted Set (ZSET).
 * Composite score = xp * 1000 + streak (XP is primary, streak breaks ties).
 * Refreshed every 5 minutes via scheduled task.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LeaderboardService {

    private static final String GLOBAL_LEADERBOARD_KEY = "leaderboard:global";
    private static final int MAX_LEADERBOARD_SIZE = 1000;

    private final StringRedisTemplate redis;
    private final UserRepository userRepository;

    /**
     * Update a single user's score in the leaderboard.
     * Called after XP changes (quiz submission, flashcard rating).
     */
    public void updateUserScore(UUID userId) {
        Optional<User> optUser = userRepository.findById(userId);
        if (optUser.isEmpty()) {
            log.warn("User not found for leaderboard update: {}", userId);
            return;
        }

        User user = optUser.get();
        // Admins do not appear on the leaderboard
        if (user.getRole() == User.Role.ADMIN) {
            redis.opsForZSet().remove(GLOBAL_LEADERBOARD_KEY, userId.toString());
            return;
        }

        double score = calculateCompositeScore(user.getXp(), user.getStreak());
        String member = userId.toString();

        redis.opsForZSet().add(GLOBAL_LEADERBOARD_KEY, member, score);
        redis.opsForZSet().removeRange(GLOBAL_LEADERBOARD_KEY, 0, -(MAX_LEADERBOARD_SIZE + 1));

        log.debug("Leaderboard score updated: userId={}, xp={}, streak={}, composite={}",
                userId, user.getXp(), user.getStreak(), score);
    }

    /**
     * Get top N users from the leaderboard.
     */
    public List<LeaderboardEntry> getTopUsers(int limit) {
        int safeLimit = Math.min(limit, MAX_LEADERBOARD_SIZE);

        Set<ZSetOperations.TypedTuple<String>> results = redis.opsForZSet()
                .reverseRangeWithScores(GLOBAL_LEADERBOARD_KEY, 0, safeLimit - 1);

        if (results == null || results.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> userIdStrings = results.stream()
                .map(tuple -> tuple.getValue())
                .collect(Collectors.toList());

        // Batch fetch users from DB
        List<UUID> uuidList = userIdStrings.stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());
        List<User> users = userRepository.findAllById(uuidList);
        var userMap = users.stream().collect(Collectors.toMap(u -> u.getId().toString(), u -> u));

        return results.stream()
                .filter(tuple -> tuple.getValue() != null && tuple.getScore() != null)
                .map(tuple -> {
                    String uid = tuple.getValue();
                    User user = userMap.get(uid);
                    if (user == null) return null;

                    long rank = 0;
                    try {
                        Long r = redis.opsForZSet().reverseRank(GLOBAL_LEADERBOARD_KEY, uid);
                        rank = r != null ? r + 1 : 0;
                    } catch (Exception ignored) {}

                    return LeaderboardEntry.of(
                            user.getId(),
                            user.getUsername(),
                            user.getAvatarUrl(),
                            (int) (tuple.getScore() / 1000), // Decode Buffed XP from Composite Score
                            user.getStreak(),
                            tuple.getScore().intValue(),
                            rank
                    );
                })
                .filter(e -> e != null)
                .collect(Collectors.toList());
    }

    /**
     * Get a user's rank in the leaderboard.
     * Returns null if user not in leaderboard.
     */
    public Long getUserRank(UUID userId) {
        Long rank = redis.opsForZSet().reverseRank(GLOBAL_LEADERBOARD_KEY, userId.toString());
        return rank != null ? rank + 1 : null; // 1-indexed
    }

    /**
     * Get a user's leaderboard entry.
     */
    public Optional<LeaderboardEntry> getUserEntry(UUID userId) {
        Optional<User> optUser = userRepository.findById(userId);
        if (optUser.isEmpty()) return Optional.empty();

        User user = optUser.get();
        Long rank = getUserRank(userId);
        Double score = redis.opsForZSet().score(GLOBAL_LEADERBOARD_KEY, userId.toString());

        return Optional.of(LeaderboardEntry.of(
                user.getId(),
                user.getUsername(),
                user.getAvatarUrl(),
                (int) ((score != null ? score : 0) / 1000), // Decode Buffed XP
                user.getStreak(),
                score != null ? score.intValue() : 0,
                rank != null ? rank : (long) getTotalUsers()
        ));
    }

    /**
     * Get total number of users in the leaderboard.
     */
    public long getTotalUsers() {
        Long size = redis.opsForZSet().size(GLOBAL_LEADERBOARD_KEY);
        return size != null ? size : 0;
    }

    /**
     * Full refresh of the leaderboard from database.
     * Scheduled every 5 minutes to sync Redis with DB state.
     */
    @Scheduled(fixedRate = 300_000) // 5 minutes
    public void refreshLeaderboard() {
        log.info("Refreshing global leaderboard...");
        List<User> allUsers = userRepository.findAll();

        // Clear and rebuild
        redis.delete(GLOBAL_LEADERBOARD_KEY);

        for (User user : allUsers) {
            // Admins do not appear on the leaderboard
            if (!user.isActive() || user.getRole() == User.Role.ADMIN) continue;

            double score = calculateCompositeScore(user.getXp(), user.getStreak());
            redis.opsForZSet().add(GLOBAL_LEADERBOARD_KEY, user.getId().toString(), score);
        }

        // Trim to max size
        redis.opsForZSet().removeRange(GLOBAL_LEADERBOARD_KEY, 0, -(MAX_LEADERBOARD_SIZE + 1));

        log.info("Leaderboard refreshed: {} users indexed", allUsers.size());
    }

    /**
     * Calculate composite score for sorting using Milestone Multipliers.
     * Primary: Base XP * Gamified Streak Multiplier (milestones of 5%)
     * Tie-breaker: Add raw streak digit at the end.
     */
    private double calculateCompositeScore(int xp, int streak) {
        double multiplier = 1.0;
        
        // Short Milestones (+5% each)
        if (streak >= 3) multiplier += 0.05;
        if (streak >= 7) multiplier += 0.05;
        if (streak >= 10) multiplier += 0.05;
        if (streak >= 21) multiplier += 0.05;
        if (streak >= 30) multiplier += 0.05; // Total +25%
        
        // Long Milestones (n + 15 increments, +5% each)
        if (streak >= 45) multiplier += 0.05; // 30%
        if (streak >= 60) multiplier += 0.05; // 35%
        if (streak >= 75) multiplier += 0.05; // 40%
        if (streak >= 90) multiplier += 0.05; // 45%
        if (streak >= 120) multiplier += 0.05; // 50% (MAXIMUM CAP)

        // Strict boundary cap
        multiplier = Math.min(multiplier, 1.50);

        // Calculate buffed XP, then apply the 1000.0 offset to preserve tie-breaking
        double buffedXp = xp * multiplier;
        return (buffedXp * 1000.0) + streak;
    }

    // =========================================================
    // WEEKLY QUIZ LEADERBOARD
    // =========================================================

    private String getWeeklyLeaderboardKey() {
        java.time.LocalDate now = java.time.LocalDate.now(com.backend.lumotus.config.AppProperties.APP_ZONE);
        int year = now.getYear();
        int week = now.get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear());
        return "leaderboard:quiz:weekly:" + year + "-" + week;
    }

    public void updateWeeklyQuizScore(UUID userId, double pointsGained) {
        if (pointsGained <= 0) return;
        String key = getWeeklyLeaderboardKey();
        redis.opsForZSet().incrementScore(key, userId.toString(), pointsGained);
        // Expiration after 14 days to avoid redis memory bloat
        redis.expire(key, 14, java.util.concurrent.TimeUnit.DAYS);
    }

    public List<LeaderboardEntry> getWeeklyTopUsers(int limit) {
        String key = getWeeklyLeaderboardKey();
        int safeLimit = Math.min(limit, MAX_LEADERBOARD_SIZE);

        Set<ZSetOperations.TypedTuple<String>> results = redis.opsForZSet()
                .reverseRangeWithScores(key, 0, safeLimit - 1);

        if (results == null || results.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> userIdStrings = results.stream()
                .map(ZSetOperations.TypedTuple::getValue)
                .collect(Collectors.toList());

        List<UUID> uuidList = userIdStrings.stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());
        List<User> users = userRepository.findAllById(uuidList);
        var userMap = users.stream().collect(Collectors.toMap(u -> u.getId().toString(), u -> u));

        return results.stream()
                .filter(tuple -> tuple.getValue() != null && tuple.getScore() != null)
                .map(tuple -> {
                    String uid = tuple.getValue();
                    User user = userMap.get(uid);
                    if (user == null) return null;

                    long rank = 0;
                    try {
                        Long r = redis.opsForZSet().reverseRank(key, uid);
                        rank = r != null ? r + 1 : 0;
                    } catch (Exception ignored) {}

                    return LeaderboardEntry.of(
                            user.getId(),
                            user.getUsername(),
                            user.getAvatarUrl(),
                            tuple.getScore().intValue(), // Weekly Points
                            user.getStreak(),
                            tuple.getScore().intValue(),
                            rank
                    );
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    public Optional<LeaderboardEntry> getWeeklyUserEntry(UUID userId) {
        Optional<User> optUser = userRepository.findById(userId);
        if (optUser.isEmpty()) return Optional.empty();

        User user = optUser.get();
        String key = getWeeklyLeaderboardKey();
        Long rank = redis.opsForZSet().reverseRank(key, userId.toString());
        Double score = redis.opsForZSet().score(key, userId.toString());
        
        int finalScore = score != null ? score.intValue() : 0;
        long finalRank = (rank != null) ? rank + 1 : (getTotalUsers(key) + 1);

        return Optional.of(LeaderboardEntry.of(
                user.getId(),
                user.getUsername(),
                user.getAvatarUrl(),
                finalScore, // Weekly points
                user.getStreak(),
                finalScore,
                finalRank
        ));
    }

    private long getTotalUsers(String key) {
        Long size = redis.opsForZSet().size(key);
        return size != null ? size : 0;
    }
}
