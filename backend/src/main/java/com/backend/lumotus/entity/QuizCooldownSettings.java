package com.backend.lumotus.entity;

import com.backend.lumotus.entity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "quiz_cooldown_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizCooldownSettings extends BaseEntity {

    /**
     * Whether cooldown enforcement is enabled globally.
     */
    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /**
     * Minimum seconds between attempts on the same quiz.
     */
    @Column(name = "min_seconds_between_attempts", nullable = false)
    @Builder.Default
    private Integer minSecondsBetweenAttempts = 600; // 10 minutes

    /**
     * Maximum attempts per user on the same quiz per day.
     */
    @Column(name = "max_attempts_per_quiz_per_day", nullable = false)
    @Builder.Default
    private Integer maxAttemptsPerQuizPerDay = 5;

    /**
     * Maximum total quiz attempts per user per day across all quizzes.
     */
    @Column(name = "max_total_attempts_per_day", nullable = false)
    @Builder.Default
    private Integer maxTotalAttemptsPerDay = 20;

    /**
     * Maximum total quiz attempts per user per week across all quizzes.
     */
    @Column(name = "max_total_attempts_per_week", nullable = false)
    @Builder.Default
    private Integer maxTotalAttemptsPerWeek = 50;

    /**
     * Admin-only: override cooldown for a specific user (UUID).
     */
    @Column(name = "bypass_user_id")
    private java.util.UUID bypassUserId;

    /**
     * Admin-only: override cooldown for a specific quiz (UUID).
     */
    @Column(name = "bypass_quiz_id")
    private java.util.UUID bypassQuizId;

    @Column(name = "bypass_expires_at")
    private Instant bypassExpiresAt;

    @Column(name = "bypass_reason")
    private String bypassReason;
}
