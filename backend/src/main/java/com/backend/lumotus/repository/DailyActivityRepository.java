package com.backend.lumotus.repository;

import com.backend.lumotus.entity.DailyActivity;
import com.backend.lumotus.entity.DailyActivityId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface DailyActivityRepository extends JpaRepository<DailyActivity, DailyActivityId> {

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
}
