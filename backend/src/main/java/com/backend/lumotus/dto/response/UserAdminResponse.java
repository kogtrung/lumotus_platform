package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserAdminResponse(
        UUID id,
        String username,
        String email,
        String role,
        int xp,
        int streak,
        Instant createdAt,
        boolean active,
        long deckCount,
        long totalCards
) {
    public static UserAdminResponse from(User user) {
        return new UserAdminResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getXp(),
                user.getStreak(),
                user.getCreatedAt(),
                user.isActive(),
                0L,
                0L
        );
    }

    public static UserAdminResponse from(User user, long deckCount, long totalCards) {
        return new UserAdminResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getXp(),
                user.getStreak(),
                user.getCreatedAt(),
                user.isActive(),
                deckCount,
                totalCards
        );
    }
}
