package com.backend.lumotus.repository;

import com.backend.lumotus.entity.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {

    // Explore: APPROVED + isPublic = true, sort by createdAt DESC
    @Query("""
        SELECT q FROM Quiz q
        WHERE q.status = :status AND q.isPublic = true
        ORDER BY q.createdAt DESC
        """)
    Page<Quiz> findExploreNewest(@Param("status") Quiz.QuizStatus status, Pageable pageable);

    // Explore: APPROVED + isPublic = true, sort by attemptCount DESC
    @Query("""
        SELECT q FROM Quiz q
        WHERE q.status = :status AND q.isPublic = true
        ORDER BY q.attemptCount DESC NULLS LAST
        """)
    Page<Quiz> findExplorePopular(@Param("status") Quiz.QuizStatus status, Pageable pageable);

    // Explore: APPROVED + isPublic = true, sort by avgScore DESC
    @Query("""
        SELECT q FROM Quiz q
        WHERE q.status = :status AND q.isPublic = true
        ORDER BY q.avgScore DESC NULLS LAST
        """)
    Page<Quiz> findExploreTrending(@Param("status") Quiz.QuizStatus status, Pageable pageable);

    // User's own quizzes (all statuses)
    Page<Quiz> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);

    // Admin: list all quizzes (all statuses including DRAFT)
    @Query("""
        SELECT q FROM Quiz q
        WHERE (:status IS NULL OR q.status = :status)
        ORDER BY q.createdAt DESC
        """)
    Page<Quiz> findAllForAdmin(@Param("status") Quiz.QuizStatus status, Pageable pageable);

    // Admin: pending for moderation
    @Query("""
        SELECT q FROM Quiz q
        WHERE q.status = :status
        ORDER BY q.createdAt DESC
        """)
    Page<Quiz> findPendingForModeration(@Param("status") Quiz.QuizStatus status, Pageable pageable);

    @Query("SELECT COUNT(qq) FROM QuizQuestion qq WHERE qq.quiz.id = :quizId")
    Integer countQuestionsByQuizId(@Param("quizId") UUID quizId);

    Optional<Quiz> findBySlug(String slug);

    Optional<Quiz> findByOwnerIdAndSlug(UUID ownerId, String slug);

    Page<Quiz> findByDeckIdOrderByCreatedAtDesc(UUID deckId, Pageable pageable);

    long countByDeckId(UUID deckId);

    long countByStatus(Quiz.QuizStatus status);

    @Modifying
    @Query("""
        UPDATE Quiz q
        SET q.attemptCount = q.attemptCount + 1,
            q.avgScore = :avgScore
        WHERE q.id = :quizId
        """)
    void updateStats(@Param("quizId") UUID quizId, @Param("avgScore") Double avgScore);

    @Modifying
    @Query("UPDATE Quiz q SET q.attemptCount = q.attemptCount + 1 WHERE q.id = :quizId")
    void incrementAttemptCount(@Param("quizId") UUID quizId);
}
