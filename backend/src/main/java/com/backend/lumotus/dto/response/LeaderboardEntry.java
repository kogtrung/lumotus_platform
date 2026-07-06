package com.backend.lumotus.dto.response;

import java.util.UUID;

/**
 * Leaderboard entry for global rankings.
 */
public record LeaderboardEntry(
        UUID userId,
        String username,
        String avatarUrl,
        int xp,
        int streak,
        int compositeScore,
        long rank
) {
    public static LeaderboardEntry of(UUID userId, String username, String avatarUrl,
                                       int xp, int streak, int compositeScore, long rank) {
        return new LeaderboardEntry(userId, username, avatarUrl, xp, streak, compositeScore, rank);
    }
}
