package com.backend.lumotus.repository;

import com.backend.lumotus.entity.UserDeckProgress;
import com.backend.lumotus.entity.UserDeckProgressId;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserDeckProgressRepository extends JpaRepository<UserDeckProgress, UserDeckProgressId> {

    boolean existsByIdUserIdAndIdDeckId(UUID userId, UUID deckId);

    @Modifying
    @Query("DELETE FROM UserDeckProgress p WHERE p.id.deckId = :deckId")
    void deleteAllByDeckId(@Param("deckId") UUID deckId);

    @Query("SELECT COALESCE(SUM(p.learnedCards), 0) FROM UserDeckProgress p WHERE p.id.userId = :userId")
    long sumLearnedCardsByUserId(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(p.masteredCards), 0) FROM UserDeckProgress p WHERE p.id.userId = :userId")
    long sumMasteredCardsByUserId(@Param("userId") UUID userId);
}
