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
        boolean active
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
                user.isActive()
        );
    }
}
