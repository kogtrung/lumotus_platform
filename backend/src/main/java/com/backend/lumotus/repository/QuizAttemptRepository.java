package com.backend.lumotus.repository;

import com.backend.lumotus.entity.QuizAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    Page<QuizAttempt> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    List<QuizAttempt> findByUserIdAndQuizIdOrderByStartedAtDesc(UUID userId, UUID quizId);

    boolean existsByUserIdAndQuizId(UUID userId, UUID quizId);

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

    // Leaderboard: top N attempts per quiz, ordered by score DESC
    @Query(value = """
        SELECT qa.* FROM quiz_attempts qa
        WHERE qa.quiz_id = :quizId
        ORDER BY qa.score DESC, qa.time_taken_seconds ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<QuizAttempt> findTopByQuiz(@Param("quizId") UUID quizId, @Param("limit") int limit);

    // Best attempt per user for a specific quiz (for leaderboard deduplication)
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

    // Count user's best attempts on a specific quiz
    @Query("""
        SELECT COUNT(DISTINCT qa.user.id) FROM QuizAttempt qa
        WHERE qa.quiz.id = :quizId
        """)
    long countDistinctUsersByQuiz(@Param("quizId") UUID quizId);
}
