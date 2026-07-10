package com.backend.lumotus.repository;

import com.backend.lumotus.entity.DailyActivity;
import com.backend.lumotus.entity.DailyActivityId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface DailyActivityRepository extends JpaRepository<DailyActivity, DailyActivityId> {

    @Query("SELECT da FROM DailyActivity da ORDER BY da.id.activityDate DESC, da.id.userId ASC")
    Page<DailyActivity> findAllOrderByDateDesc(Pageable pageable);

    @Query(value = "SELECT da.id.userId, u.username, " +
                   "SUM(da.cardsReviewed), " +
                   "u.xp, " +
                   "SUM(da.quizTaken), " +
                   "MAX(da.id.activityDate), " +
                   "SUM(da.studyMinutes), " +
                   "u.streak " +
                   "FROM DailyActivity da, User u " +
                   "WHERE da.id.userId = u.id " +
                   "GROUP BY da.id.userId, u.username, u.xp, u.streak " +
                   "ORDER BY MAX(da.id.activityDate) DESC",
           countQuery = "SELECT COUNT(DISTINCT da.id.userId) FROM DailyActivity da")
    Page<Object[]> findUserStudySummaries(Pageable pageable);

    @Query("SELECT da FROM DailyActivity da WHERE da.id.userId = :userId ORDER BY da.id.activityDate DESC")
    Page<DailyActivity> findByUserIdOrderByDateDesc(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT da FROM DailyActivity da WHERE da.id.userId = :userId " +
           "AND da.id.activityDate BETWEEN :startDate AND :endDate " +
           "ORDER BY da.id.activityDate ASC")
    List<DailyActivity> findByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(da.cardsReviewed), 0) FROM DailyActivity da " +
           "WHERE da.id.userId = :userId AND da.id.activityDate BETWEEN :startDate AND :endDate")
    int sumCardsReviewed(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(da.quizTaken), 0) FROM DailyActivity da " +
           "WHERE da.id.userId = :userId AND da.id.activityDate BETWEEN :startDate AND :endDate")
    int sumQuizTaken(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(da.xpEarned), 0) FROM DailyActivity da " +
           "WHERE da.id.userId = :userId AND da.id.activityDate BETWEEN :startDate AND :endDate")
    int sumXpEarned(
            @Param("userId") UUID userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // For admin stats
    @Query("SELECT COUNT(DISTINCT da.id.userId) FROM DailyActivity da " +
           "WHERE da.id.activityDate BETWEEN :startDate AND :endDate AND da.cardsReviewed > 0")
    int countActiveUsersOnDate(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(da.cardsReviewed), 0) FROM DailyActivity da " +
           "WHERE da.id.activityDate BETWEEN :startDate AND :endDate")
    int sumCardsReviewedAll(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(da.xpEarned), 0) FROM DailyActivity da " +
           "WHERE da.id.activityDate BETWEEN :startDate AND :endDate")
    int sumXpEarnedAll(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
