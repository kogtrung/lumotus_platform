package com.backend.lumotus.repository;

import com.backend.lumotus.entity.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {

    // Public explore page: only APPROVED quizzes
    Page<Quiz> findByStatusOrderByCreatedAtDesc(Quiz.QuizStatus status, Pageable pageable);

    // User's own quizzes (all statuses)
    Page<Quiz> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);

    // Count pending for admin badge
    long countByStatus(Quiz.QuizStatus status);

    @Modifying
    @Query("""
        UPDATE Quiz q
        SET q.attemptCount = q.attemptCount + 1,
            q.avgScore = :avgScore
        WHERE q.id = :quizId
        """)
    void updateStats(@Param("quizId") UUID quizId, @Param("avgScore") Double avgScore);

    @Query("""
        SELECT q FROM Quiz q
        WHERE q.status = :status
        ORDER BY q.createdAt DESC
        """)
    Page<Quiz> findPendingForModeration(@Param("status") Quiz.QuizStatus status, Pageable pageable);
}
