package com.backend.lumotus.repository;

import com.backend.lumotus.entity.QuizAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    Page<QuizAttempt> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    List<QuizAttempt> findByUserIdAndQuizIdOrderByStartedAtDesc(UUID userId, UUID quizId);

    boolean existsByUserIdAndQuizId(UUID userId, UUID quizId);

    List<QuizAttempt> findByQuizIdOrderByStartedAtDesc(UUID quizId);

    void deleteByQuizId(UUID quizId);

    @Query("""
        SELECT MAX(qa.score) FROM QuizAttempt qa
        WHERE qa.user.id = :userId AND qa.quiz.id = :quizId
        """)
    java.util.Optional<Double> findBestScoreByUserAndQuiz(@Param("userId") UUID userId, @Param("quizId") UUID quizId);

    @Query("""
        SELECT AVG(qa.score) FROM QuizAttempt qa
        WHERE qa.quiz.id = :quizId
        """)
    java.util.Optional<Double> findAvgScoreByQuizId(@Param("quizId") UUID quizId);

    @Query(value = """
        SELECT qa.* FROM quiz_attempts qa
        WHERE qa.quiz_id = :quizId
        ORDER BY qa.score DESC, qa.time_taken_seconds ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<QuizAttempt> findTopByQuiz(@Param("quizId") UUID quizId, @Param("limit") int limit);

    @Query("""
        SELECT qa FROM QuizAttempt qa
        WHERE qa.quiz.id = :quizId
        AND qa.score = (
            SELECT MAX(qa2.score) FROM QuizAttempt qa2
            WHERE qa2.user.id = qa.user.id AND qa2.quiz.id = :quizId
        )
        ORDER BY qa.score DESC, qa.timeTakenSeconds ASC
        """)
    List<QuizAttempt> findBestAttemptsPerUser(@Param("quizId") UUID quizId, Pageable pageable);

    @Query("""
        SELECT COUNT(DISTINCT qa.user.id) FROM QuizAttempt qa
        WHERE qa.quiz.id = :quizId
        """)
    long countDistinctUsersByQuiz(@Param("quizId") UUID quizId);

    /**
     * Find active (IN_PROGRESS) quiz attempts for a user.
     */
    @Query("""
        SELECT qa FROM QuizAttempt qa
        WHERE qa.user.id = :userId
        AND qa.status = 'IN_PROGRESS'
        ORDER BY qa.startedAt DESC
        """)
    List<QuizAttempt> findActiveByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM QuizAttempt qa WHERE qa.quiz.id = :quizId")
    void deleteAllByQuizId(@Param("quizId") UUID quizId);

    /**
     * Atomically close (quit) a quiz attempt.
     * Only updates rows where status = 'IN_PROGRESS' — prevents race with submitQuiz.
     */
    @Modifying
    @Query(value = """
        UPDATE quiz_attempts
        SET finished_at = NOW(),
            status = 'ABANDONED',
            score = 0.0,
            updated_at = NOW()
        WHERE id = :attemptId
        AND status = 'IN_PROGRESS'
        """, nativeQuery = true)
    int closeAttemptById(@Param("attemptId") UUID attemptId);

    @Modifying
    @Query(value = """
        UPDATE quiz_attempts
        SET finished_at = NOW(),
            status = 'ABANDONED',
            score = 0.0,
            updated_at = NOW()
        WHERE user_id = :userId
        AND quiz_id = :quizId
        AND status = 'IN_PROGRESS'
        """, nativeQuery = true)
    int closeUnsubmittedByUserAndQuiz(@Param("userId") UUID userId, @Param("quizId") UUID quizId);

    @Modifying
    @Query(value = """
        UPDATE quiz_attempts
        SET finished_at = NOW(),
            status = 'ABANDONED',
            score = 0.0,
            updated_at = NOW()
        WHERE user_id = :userId
        AND status = 'IN_PROGRESS'
        """, nativeQuery = true)
    int closeAllUnsubmittedByUser(@Param("userId") UUID userId);

    /**
     * Mark attempt as completed.
     */
    @Modifying
    @Query(value = """
        UPDATE quiz_attempts
        SET status = 'COMPLETED',
            finished_at = NOW(),
            updated_at = NOW()
        WHERE id = :attemptId
        AND status = 'IN_PROGRESS'
        """, nativeQuery = true)
    int completeAttempt(@Param("attemptId") UUID attemptId);

    @Query(value = """
        WITH best_per_quiz AS (
            SELECT DISTINCT ON (qa2.user_id, qa2.quiz_id)
                qa2.user_id,
                qa2.quiz_id,
                qa2.score               AS best_score,
                qa2.correct_answers,
                qa2.time_taken_seconds,
                ROW_NUMBER() OVER (
                    PARTITION BY qa2.user_id, qa2.quiz_id
                    ORDER BY qa2.score DESC, qa2.time_taken_seconds ASC
                ) AS rn
            FROM quiz_attempts qa2
            INNER JOIN quizzes q ON q.id = qa2.quiz_id
            WHERE q.status = 'APPROVED'
        )
        SELECT
            bpq.user_id,
            u.username,
            COALESCE(u.avatar_url, ''),
            AVG(bpq.best_score)        AS avg_best_score,
            COUNT(DISTINCT bpq.quiz_id) AS quizzes_completed,
            SUM(bpq.correct_answers)   AS total_correct_answers,
            SUM(bpq.time_taken_seconds) AS total_time_seconds
        FROM best_per_quiz bpq
        INNER JOIN users u ON u.id = bpq.user_id
        WHERE bpq.rn = 1
        GROUP BY bpq.user_id, u.username, u.avatar_url
        ORDER BY AVG(bpq.best_score) DESC, SUM(bpq.correct_answers) DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<Object[]> findGlobalQuizLeaderboard(@Param("limit") int limit);

    /**
     * Find all quiz attempts with pagination, ordered by most recent.
     */
    @Query("""
        SELECT qa FROM QuizAttempt qa
        JOIN FETCH qa.user u
        LEFT JOIN FETCH qa.quiz q
        ORDER BY qa.startedAt DESC
        """)
    Page<QuizAttempt> findAllWithUserAndQuizOrderByStartedAtDesc(Pageable pageable);

    /**
     * Find quiz attempts by user ID with pagination.
     */
    @Query("""
        SELECT qa FROM QuizAttempt qa
        JOIN FETCH qa.user u
        LEFT JOIN FETCH qa.quiz q
        WHERE qa.user.id = :userId
        ORDER BY qa.startedAt DESC
        """)
    Page<QuizAttempt> findByUserIdWithDetails(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Find quiz attempts by quiz ID with pagination.
     */
    @Query("""
        SELECT qa FROM QuizAttempt qa
        JOIN FETCH qa.user u
        LEFT JOIN FETCH qa.quiz q
        WHERE qa.quiz.id = :quizId
        ORDER BY qa.startedAt DESC
        """)
    Page<QuizAttempt> findByQuizIdWithDetails(@Param("quizId") UUID quizId, Pageable pageable);

    // ============================================================
    // COOLDOWN QUERIES
    // ============================================================

    /**
     * Count attempts by user for a specific quiz since a given time (e.g., last 24 hours).
     */
    @Query("""
        SELECT COUNT(qa) FROM QuizAttempt qa
        WHERE qa.user.id = :userId
        AND qa.quiz.id = :quizId
        AND qa.startedAt >= :since
        """)
    long countAttemptsSince(
            @Param("userId") UUID userId,
            @Param("quizId") UUID quizId,
            @Param("since") Instant since);

    /**
     * Find the most recent completed attempt for a user-quiz pair.
     */
    @Query("""
        SELECT qa FROM QuizAttempt qa
        WHERE qa.user.id = :userId
        AND qa.quiz.id = :quizId
        AND qa.status = 'COMPLETED'
        ORDER BY qa.finishedAt DESC
        """)
    List<QuizAttempt> findLastCompletedAttempt(
            @Param("userId") UUID userId,
            @Param("quizId") UUID quizId);

    /**
     * Count total attempts by user across ALL quizzes since a given time.
     */
    @Query("""
        SELECT COUNT(qa) FROM QuizAttempt qa
        WHERE qa.user.id = :userId
        AND qa.startedAt >= :since
        """)
    long countTotalAttemptsSince(
            @Param("userId") UUID userId,
            @Param("since") Instant since);

    @Query(
        "SELECT CAST(qa.startedAt AS date), COUNT(qa) " +
        "FROM QuizAttempt qa " +
        "WHERE qa.startedAt >= :start AND qa.startedAt <= :end " +
        "GROUP BY CAST(qa.startedAt AS date) " +
        "ORDER BY CAST(qa.startedAt AS date) ASC"
    )
    java.util.List<Object[]> countQuizAttemptsByDay(
            @Param("start") Instant start,
            @Param("end") Instant end);
}
