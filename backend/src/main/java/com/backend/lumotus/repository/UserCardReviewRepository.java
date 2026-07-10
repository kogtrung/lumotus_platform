package com.backend.lumotus.repository;

import com.backend.lumotus.entity.UserCardReview;
import com.backend.lumotus.entity.UserCardReviewId;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserCardReviewRepository extends JpaRepository<UserCardReview, UserCardReviewId> {

    Optional<UserCardReview> findByIdUserIdAndIdCardId(UUID userId, UUID cardId);

    @Query(
            """
            SELECT r FROM UserCardReview r
            WHERE r.id.userId = :userId
            AND r.nextReviewAt <= :now
            AND (:deckId IS NULL OR r.deckId = :deckId)
            AND (:starredOnly = false OR r.starred = true)
            ORDER BY r.nextReviewAt ASC
            """)
    List<UserCardReview> findDueReviews(
            @Param("userId") UUID userId,
            @Param("deckId") UUID deckId,
            @Param("now") Instant now,
            @Param("starredOnly") boolean starredOnly,
            Pageable pageable);

    @Query(
            """
            SELECT COUNT(r) FROM UserCardReview r
            WHERE r.id.userId = :userId
            AND r.nextReviewAt <= :now
            AND (:deckId IS NULL OR r.deckId = :deckId)
            AND (:starredOnly = false OR r.starred = true)
            """)
    long countDueReviews(
            @Param("userId") UUID userId,
            @Param("deckId") UUID deckId,
            @Param("now") Instant now,
            @Param("starredOnly") boolean starredOnly);

    @Modifying
    @Query("DELETE FROM UserCardReview r WHERE r.deckId = :deckId")
    void deleteAllByDeckId(@Param("deckId") UUID deckId);
}
