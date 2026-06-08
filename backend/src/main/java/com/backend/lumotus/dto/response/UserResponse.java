package com.backend.lumotus.dto.response;

import com.backend.lumotus.entity.User;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String username,
        String email,
        String role,
        int xp,
        int streak,
        String avatarUrl) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.getXp(),
                user.getStreak(),
                user.getAvatarUrl());
    }
}
