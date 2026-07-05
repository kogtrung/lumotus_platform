package com.backend.lumotus.repository;

import com.backend.lumotus.entity.QuizCooldownSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizCooldownSettingsRepository extends JpaRepository<QuizCooldownSettings, UUID> {

    /**
     * Get the singleton settings row.
     */
    @Query("SELECT s FROM QuizCooldownSettings s ORDER BY s.createdAt ASC LIMIT 1")
    Optional<QuizCooldownSettings> findSingleton();

    /**
     * Find active bypass for a user (non-expired).
     */
    @Query("""
        SELECT s FROM QuizCooldownSettings s
        WHERE s.bypassUserId = :userId
        AND (s.bypassExpiresAt IS NULL OR s.bypassExpiresAt > :now)
        """)
    Optional<QuizCooldownSettings> findActiveBypassForUser(
            @Param("userId") UUID userId,
            @Param("now") Instant now);

    /**
     * Find active bypass for a quiz (non-expired).
     */
    @Query("""
        SELECT s FROM QuizCooldownSettings s
        WHERE s.bypassQuizId = :quizId
        AND (s.bypassExpiresAt IS NULL OR s.bypassExpiresAt > :now)
        """)
    Optional<QuizCooldownSettings> findActiveBypassForQuiz(
            @Param("quizId") UUID quizId);
}
