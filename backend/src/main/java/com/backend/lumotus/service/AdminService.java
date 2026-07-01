package com.backend.lumotus.service;

import com.backend.lumotus.dto.response.AdminStatsResponse;
import com.backend.lumotus.dto.response.UserAdminResponse;
import com.backend.lumotus.entity.User;
import com.backend.lumotus.exception.ForbiddenException;
import com.backend.lumotus.exception.ResourceNotFoundException;
import com.backend.lumotus.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

/**
 * Admin service for user management and system statistics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final DeckRepository deckRepository;
    private final CardRepository cardRepository;
    private final QuizRepository quizRepository;
    private final DailyActivityRepository dailyActivityRepository;

    /**
     * Get system-wide statistics.
     */
    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        long totalUsers = userRepository.count();
        long totalDecks = deckRepository.count();
        long totalCards = cardRepository.count();
        long totalQuizzes = quizRepository.count();

        long activeUsersToday = dailyActivityRepository.countActiveUsersOnDate(today, today);
        int reviewsToday = dailyActivityRepository.sumCardsReviewedAll(today, today);
        int xpToday = dailyActivityRepository.sumXpEarnedAll(today, today);

        return new AdminStatsResponse(
                totalUsers,
                totalDecks,
                totalCards,
                totalQuizzes,
                activeUsersToday,
                reviewsToday,
                xpToday
        );
    }

    /**
     * List all users with pagination.
     */
    @Transactional(readOnly = true)
    public Page<UserAdminResponse> listUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(UserAdminResponse::from);
    }

    /**
     * Get a specific user by ID.
     */
    @Transactional(readOnly = true)
    public UserAdminResponse getUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return UserAdminResponse.from(user);
    }

    /**
     * Update user's role or active status.
     */
    @Transactional
    public UserAdminResponse updateUser(UUID targetUserId, String role, Boolean active) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (role != null) {
            try {
                user.setRole(User.Role.valueOf(role.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role: " + role);
            }
        }

        if (active != null) {
            user.setActive(active);
        }

        userRepository.save(user);
        log.info("Admin updated user {}: role={}, active={}", targetUserId, role, active);

        return UserAdminResponse.from(user);
    }

    /**
     * Check if current user is admin.
     */
    public void requireAdmin(String userRole) {
        if (!"ADMIN".equals(userRole)) {
            throw new ForbiddenException("Admin access required");
        }
    }
}
