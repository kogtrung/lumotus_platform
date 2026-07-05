package com.backend.lumotus.repository;

import com.backend.lumotus.entity.QuizSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizSessionRepository extends JpaRepository<QuizSession, UUID> {

    Optional<QuizSession> findByAttemptId(UUID attemptId);

    Optional<QuizSession> findByAttemptIdAndUserId(UUID attemptId, UUID userId);

    List<QuizSession> findByUserIdAndStatus(UUID userId, QuizSession.SessionStatus status);

    @Query("SELECT qs FROM QuizSession qs WHERE qs.userId = :userId AND qs.status = 'IN_PROGRESS'")
    List<QuizSession> findActiveByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("UPDATE QuizSession qs SET qs.lastActivity = :activityAt WHERE qs.attempt.id = :attemptId")
    void updateLastActivity(@Param("attemptId") UUID attemptId, @Param("activityAt") Instant activityAt);

    @Modifying
    @Query("UPDATE QuizSession qs SET qs.status = :status, qs.endedAt = :endedAt WHERE qs.attempt.id = :attemptId")
    void updateStatus(@Param("attemptId") UUID attemptId, @Param("status") QuizSession.SessionStatus status, @Param("endedAt") Instant endedAt);
}
